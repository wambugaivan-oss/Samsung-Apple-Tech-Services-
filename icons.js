/* ============================================================================
   ICONS.JS — a small, reusable set of inline-SVG illustrations used as
   representative imagery across the whole product catalogue. Zero network
   requests, infinitely scalable, and a handful of KB total — this is how the
   site stays visual across 3,000+ items without shipping thousands of photos.
   Each icon accepts a text label (used as an SVG <title> for accessibility/SEO).
============================================================================ */
(function(){
  const PATHS = {
    phone:'<rect x="7" y="2" width="10" height="20" rx="1.6"/><line x1="10" y1="19" x2="14" y2="19"/>',
    screen:'<rect x="7" y="2" width="10" height="20" rx="1.6"/><rect x="8.4" y="3.4" width="7.2" height="14.4" rx=".5" fill="currentColor" fill-opacity=".18" stroke="none"/>',
    battery:'<rect x="2" y="8" width="17" height="8" rx="1.4"/><line x1="22" y1="10.5" x2="22" y2="13.5"/><rect x="4.5" y="10" width="7" height="4" fill="currentColor" fill-opacity=".35" stroke="none"/>',
    plug:'<path d="M8 2v6M14 2v6M6 8h12v3.5a6 6 0 0 1-12 0V8zM11 17.5v4.5"/>',
    backglass:'<rect x="7" y="2" width="10" height="20" rx="1.6"/><rect x="7" y="2" width="10" height="20" rx="1.6" fill="currentColor" fill-opacity=".12" stroke="none"/>',
    camera:'<path d="M22 18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5l1.7-2.4h5.6L16.5 6H20a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="3.6"/>',
    speaker:'<path d="M5 9h3.5L13 5.5v13L8.5 15H5z"/><path d="M17 8a5 5 0 0 1 0 8"/><path d="M19.5 5.5a9 9 0 0 1 0 13"/>',
    chip:'<rect x="6" y="6" width="12" height="12" rx="1"/><line x1="9" y1="2" x2="9" y2="6"/><line x1="15" y1="2" x2="15" y2="6"/><line x1="9" y1="18" x2="9" y2="22"/><line x1="15" y1="18" x2="15" y2="22"/><line x1="2" y1="9" x2="6" y2="9"/><line x1="2" y1="15" x2="6" y2="15"/><line x1="18" y1="9" x2="22" y2="9"/><line x1="18" y1="15" x2="22" y2="15"/>',
    button:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.4" fill="currentColor" fill-opacity=".35" stroke="none"/>',
    cable:'<path d="M4 4l6 6M20 20l-6-6M9 3l3 3-6 6-3-3zM15 21l-3-3 6-6 3 3z"/>',
    signal:'<path d="M4 18v-3M9 18v-7M14 18V7M19 18V4"/>',
    fan:'<circle cx="12" cy="12" r="2.4"/><path d="M12 9.6c0-2.7-1.5-6-4-6.4M12 14.4c0 2.7 1.5 6 4 6.4M9.6 12c-2.7 0-6 1.5-6.4 4M14.4 12c2.7 0 6-1.5 6.4-4"/>',
    disk:'<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="3"/>',
    accessory:'<circle cx="7" cy="17" r="3"/><circle cx="17" cy="7" r="3"/><path d="M9.1 14.9 14.9 9.1"/>',
    tv:'<rect x="2.5" y="4" width="19" height="13" rx="1.4"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    laptop:'<rect x="4" y="4" width="16" height="11" rx="1.2"/><path d="M2 19h20l-1.6-3H3.6z"/>',
    tablet:'<rect x="5" y="2.5" width="14" height="19" rx="1.6"/><line x1="10.4" y1="19.2" x2="13.6" y2="19.2"/>',
    watch:'<rect x="7.5" y="7" width="9" height="10" rx="2"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M9 17v3a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3"/>',
    earbuds:'<circle cx="7" cy="9" r="3"/><circle cx="17" cy="9" r="3"/><path d="M7 12v3a3 3 0 0 0 6 0M17 12v3a3 3 0 0 1-6 0"/>',
    console:'<rect x="2" y="8" width="20" height="9" rx="4"/><circle cx="7" cy="12.5" r="1.3" fill="currentColor" stroke="none"/><circle cx="17" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="17.5" cy="13.6" r="1.1" fill="currentColor" stroke="none"/>',
    pc:'<rect x="3" y="3" width="9" height="15" rx="1"/><line x1="15" y1="6" x2="21" y2="6"/><line x1="15" y1="10" x2="21" y2="10"/><circle cx="7.5" cy="16" r=".6" fill="currentColor" stroke="none"/>',
    powerbank:'<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M13 7l-3 5h3l-3 5"/>',
    router:'<rect x="3" y="10" width="18" height="7" rx="1.4"/><line x1="7" y1="10" x2="7" y2="6"/><line x1="12" y1="10" x2="12" y2="5"/><line x1="17" y1="10" x2="17" y2="6"/>',
  };
  const GRADIENTS = [
    ['#0B0F14','#1c2530'], ['#123a34','#0E9370'], ['#3a1f14','#C1622C'],
    ['#141c3a','#1428A0'], ['#2a1430','#7a2f8c'], ['#1a2b1a','#2f7a3f'],
  ];
  function hash(s){ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); }

  /* Returns an <svg> string. `seed` (e.g. brand+model) picks a stable gradient
     so the same product always renders the same tile color. */
  window.SATSU_ICON = function(key, label, seed){
    const path = PATHS[key] || PATHS.phone;
    const g = GRADIENTS[hash(seed||key) % GRADIENTS.length];
    const gid = 'g'+hash((seed||key)+key);
    return `<svg viewBox="0 0 24 24" role="img" aria-label="${label||key}">
      <title>${label||key}</title>
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/>
      </linearGradient></defs>
      <rect x="0" y="0" width="24" height="24" fill="url(#${gid})" opacity="0"/>
      <g fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${path}</g>
    </svg>`;
  };
  window.SATSU_ICON_TILE_BG = function(seed, key){
    const g = GRADIENTS[hash(seed||key||'x') % GRADIENTS.length];
    return `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
  };
})();
