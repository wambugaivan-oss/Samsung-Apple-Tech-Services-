/* ============================================================================
SITE-MEDIA.JS — Admin Panel image management for every editable visual slot
on the site (hero sections, category cards, per-product photo overrides, etc).

WHY THIS IS A SEPARATE FILE: db.js already defines window.SATSU_DB with
getServices/saveService/getBanners/uploadMedia etc. This file does NOT modify
or replace db.js — it safely ADDS new methods onto the same window.SATSU_DB
object using Object.assign, so every existing page keeps working exactly as
before. It talks to Supabase directly via the REST API using the same public
anon key already exposed on window.SATSU_CONFIG by config.js, so it needs no
knowledge of how db.js is implemented internally.

Load order in <head>: config.js, then db.js, then this file.
============================================================================ */
(function () {
  function restHeaders(extra) {
    var cfg = window.SATSU_CONFIG || {};
    var key = cfg.SUPABASE_ANON_KEY || '';
    return Object.assign({
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json'
    }, extra || {});
  }

  function restUrl(path) {
    var cfg = window.SATSU_CONFIG || {};
    return (cfg.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1/' + path;
  }

  function isConfigured() {
    return !!(window.SATSU_CONFIG && window.SATSU_CONFIG.SUPABASE_URL && window.SATSU_CONFIG.SUPABASE_ANON_KEY);
  }

  // ---- Local-demo fallback (mirrors the pattern the rest of the site uses
  // when no Supabase backend is configured yet) ----
  function localGet() {
    try { return JSON.parse(localStorage.getItem('satsu_site_images') || '[]'); }
    catch (e) { return []; }
  }
  function localSet(list) {
    localStorage.setItem('satsu_site_images', JSON.stringify(list));
  }

  /**
   * Get all images for a given slot, ordered by position.
   * A slot can hold one image (hero, category icon) or many (a gallery/slider).
   */
  async function getSiteImages(slotKey) {
    if (!isConfigured()) {
      return localGet().filter(function (r) { return r.slot_key === slotKey; })
        .sort(function (a, b) { return a.position - b.position; });
    }
    try {
      var url = restUrl('site_images?slot_key=eq.' + encodeURIComponent(slotKey) + '&order=position.asc');
      var res = await fetch(url, { headers: restHeaders() });
      if (!res.ok) return [];
      return await res.json();
    } catch (e) { return []; }
  }

  /** Get every image across every slot, grouped by slot_key — used by the admin Media Library browser. */
  async function getAllSiteImages() {
    var list;
    if (!isConfigured()) {
      list = localGet();
    } else {
      try {
        var res = await fetch(restUrl('site_images?order=slot_key.asc,position.asc'), { headers: restHeaders() });
        list = res.ok ? await res.json() : [];
      } catch (e) { list = []; }
    }
    var grouped = {};
    list.forEach(function (row) {
      if (!grouped[row.slot_key]) grouped[row.slot_key] = [];
      grouped[row.slot_key].push(row);
    });
    return grouped;
  }

  /**
   * Upload a file for a slot and save it as a new site_images row.
   * Reuses the site's existing, already-working upload function for the
   * actual file transfer — this file only adds the new database row.
   */
  async function uploadSiteImage(file, slotKey, altText) {
    if (!window.SATSU_DB || typeof window.SATSU_DB.uploadMedia !== 'function') {
      return { error: 'Upload function not available (db.js not loaded).' };
    }
    var uploadResult = await window.SATSU_DB.uploadMedia(file, 'site-images/' + slotKey.split('.')[0]);
    if (uploadResult.error || !uploadResult.url) {
      return { error: uploadResult.error || 'Upload failed' };
    }
    var existing = await getSiteImages(slotKey);
    var nextPosition = existing.length ? Math.max.apply(null, existing.map(function (r) { return r.position; })) + 1 : 0;
    var row = { slot_key: slotKey, image_url: uploadResult.url, alt_text: altText || '', position: nextPosition };

    if (!isConfigured()) {
      var all = localGet();
      row.id = 'local-' + Date.now();
      row.created_at = new Date().toISOString();
      all.push(row);
      localSet(all);
      return { data: row, error: null };
    }
    try {
      var res = await fetch(restUrl('site_images'), {
        method: 'POST',
        headers: restHeaders({ 'Prefer': 'return=representation' }),
        body: JSON.stringify(row)
      });
      if (!res.ok) return { error: 'Save failed (' + res.status + ')' };
      var saved = await res.json();
      return { data: saved[0], error: null };
    } catch (e) { return { error: String(e) }; }
  }

  async function deleteSiteImage(id) {
    if (!isConfigured()) {
      localSet(localGet().filter(function (r) { return r.id !== id; }));
      return { error: null };
    }
    try {
      var res = await fetch(restUrl('site_images?id=eq.' + encodeURIComponent(id)), {
        method: 'DELETE', headers: restHeaders()
      });
      return { error: res.ok ? null : 'Delete failed (' + res.status + ')' };
    } catch (e) { return { error: String(e) }; }
  }

  async function updateSiteImageAlt(id, altText) {
    if (!isConfigured()) {
      var all = localGet();
      var row = all.find(function (r) { return r.id === id; });
      if (row) row.alt_text = altText;
      localSet(all);
      return { error: null };
    }
    try {
      var res = await fetch(restUrl('site_images?id=eq.' + encodeURIComponent(id)), {
        method: 'PATCH', headers: restHeaders(), body: JSON.stringify({ alt_text: altText })
      });
      return { error: res.ok ? null : 'Update failed (' + res.status + ')' };
    } catch (e) { return { error: String(e) }; }
  }

  /** Reorder images within a slot. orderedIds = array of image ids in the new desired order. */
  async function reorderSiteImages(slotKey, orderedIds) {
    if (!isConfigured()) {
      var all = localGet();
      orderedIds.forEach(function (id, idx) {
        var row = all.find(function (r) { return r.id === id; });
        if (row) row.position = idx;
      });
      localSet(all);
      return { error: null };
    }
    try {
      await Promise.all(orderedIds.map(function (id, idx) {
        return fetch(restUrl('site_images?id=eq.' + encodeURIComponent(id)), {
          method: 'PATCH', headers: restHeaders(), body: JSON.stringify({ position: idx })
        });
      }));
      return { error: null };
    } catch (e) { return { error: String(e) }; }
  }

  // Extend the existing global SATSU_DB object — never replaces it.
  window.SATSU_DB = window.SATSU_DB || {};
  Object.assign(window.SATSU_DB, {
    getSiteImages: getSiteImages,
    getAllSiteImages: getAllSiteImages,
    uploadSiteImage: uploadSiteImage,
    deleteSiteImage: deleteSiteImage,
    updateSiteImageAlt: updateSiteImageAlt,
    reorderSiteImages: reorderSiteImages
  });

  /**
   * Helper for public-facing pages: renders an <img> into `container` if an
   * admin-uploaded image exists for `slotKey`, otherwise leaves the existing
   * fallback content (icon/gradient) untouched. This is how every page below
   * stays visually identical until you actually upload something.
   */
  window.SATSU_applySlotImage = async function (slotKey, containerEl, imgClass) {
    if (!containerEl) return false;
    try {
      var images = await getSiteImages(slotKey);
      if (!images.length) return false;
      var img = document.createElement('img');
      img.src = images[0].image_url;
      img.alt = images[0].alt_text || '';
      if (imgClass) img.className = imgClass;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      containerEl.innerHTML = '';
      containerEl.appendChild(img);
      return true;
    } catch (e) { return false; }
  };
})();
