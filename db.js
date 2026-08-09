/* ============================================================================
   DB.JS — shared data layer for the whole site.
   Every page includes config.js then this file. All pages call the same
   functions below (SATSU_DB.getServices(), SATSU_DB.addBooking(), etc.)
   without needing to know whether data is coming from Supabase or from
   browser storage — this file decides that once, based on config.js.
============================================================================ */
(function(){
  const cfg = window.SATSU_CONFIG || {};
  const CONFIGURED = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  let supa = null;

  function loadLocal(){ return {
    services: JSON.parse(localStorage.getItem('satsu_admin_services') || 'null'),
    banners: JSON.parse(localStorage.getItem('satsu_admin_promos') || 'null'),
    reviews: JSON.parse(localStorage.getItem('satsu_admin_reviews') || 'null'),
    posts: JSON.parse(localStorage.getItem('satsu_admin_posts') || 'null'),
    bookings: JSON.parse(localStorage.getItem('satsu_local_bookings') || '[]'),
    sellRequests: JSON.parse(localStorage.getItem('satsu_local_sell') || '[]'),
  };}
  function setLocal(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  async function ensureClient(){
    if(!CONFIGURED) return null;
    if(supa) return supa;
    if(!window.supabase){
      await new Promise((res,rej)=>{
        const s=document.createElement('script');
        s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        s.onload=res; s.onerror=rej; document.head.appendChild(s);
      });
    }
    supa = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    return supa;
  }

  const DB = {
    isConfigured(){ return CONFIGURED; },

    /* ---------- AUTH (admin only) ---------- */
    async signIn(email, password){
      const c = await ensureClient(); if(!c) return {error:"Backend not configured yet — see config.js"};
      const {data,error} = await c.auth.signInWithPassword({email,password});
      return {data, error: error ? error.message : null};
    },
    async signOut(){ const c = await ensureClient(); if(c) await c.auth.signOut(); },
    async currentUser(){ const c = await ensureClient(); if(!c) return null; const {data} = await c.auth.getUser(); return data?.user || null; },

    /* ---------- SERVICES ---------- */
    async getServices(){
      if(CONFIGURED){ const c=await ensureClient(); const {data,error}=await c.from('services').select('*').order('name'); if(error){console.error(error);return [];} return data; }
      return loadLocal().services || null;
    },
    async saveService(svc){
      if(CONFIGURED){ const c=await ensureClient(); if(!svc.id) svc.id = 'svc-'+Math.random().toString(36).slice(2,9);
        const {error}=await c.from('services').upsert(svc); return {error: error?.message||null}; }
      const list = loadLocal().services || [];
      const i = list.findIndex(s=>s.id===svc.id);
      if(!svc.id) svc.id = 'svc-'+Math.random().toString(36).slice(2,9);
      if(i>-1) list[i]=svc; else list.push(svc);
      setLocal('satsu_admin_services', list); return {error:null};
    },
    async deleteService(id){
      if(CONFIGURED){ const c=await ensureClient(); const {error}=await c.from('services').delete().eq('id',id); return {error:error?.message||null}; }
      const list = (loadLocal().services||[]).filter(s=>s.id!==id);
      setLocal('satsu_admin_services', list); return {error:null};
    },

    /* ---------- BANNERS ---------- */
    async getBanners(){
      if(CONFIGURED){ const c=await ensureClient(); const {data,error}=await c.from('banners').select('*').order('sort_order');
        if(error){console.error(error);return [];}
        return data.map(b=>({id:b.id,tag:b.tag,title:b.title,desc:b.description,price:b.cta_text})); }
      return loadLocal().banners || null;
    },
    async saveBanner(b, idx){
      if(CONFIGURED){ const c=await ensureClient();
        const row = {tag:b.tag, title:b.title, description:b.desc, cta_text:b.price};
        if(b.id) row.id = b.id;
        const {error}=await c.from('banners').upsert(row); return {error: error?.message||null}; }
      const list = loadLocal().banners || [];
      if(idx!==null && idx!==undefined) list[idx]=b; else list.push(b);
      setLocal('satsu_admin_promos', list); return {error:null};
    },
    async deleteBanner(idOrIdx){
      if(CONFIGURED){ const c=await ensureClient(); const {error}=await c.from('banners').delete().eq('id',idOrIdx); return {error:error?.message||null}; }
      const list = loadLocal().banners || []; list.splice(idOrIdx,1);
      setLocal('satsu_admin_promos', list); return {error:null};
    },

    /* ---------- REVIEWS ---------- */
    async getReviews(){
      if(CONFIGURED){ const c=await ensureClient(); const {data,error}=await c.from('reviews').select('*').order('created_at',{ascending:false});
        if(error){console.error(error);return [];}
        return data.map(r=>({id:r.id,name:r.name,text:r.review_text})); }
      return loadLocal().reviews || null;
    },
    async saveReview(r, idx){
      if(CONFIGURED){ const c=await ensureClient();
        const row = {name:r.name, review_text:r.text}; if(r.id) row.id=r.id;
        const {error}=await c.from('reviews').upsert(row); return {error: error?.message||null}; }
      const list = loadLocal().reviews || [];
      if(idx!==null && idx!==undefined) list[idx]=r; else list.push(r);
      setLocal('satsu_admin_reviews', list); return {error:null};
    },
    async deleteReview(idOrIdx){
      if(CONFIGURED){ const c=await ensureClient(); const {error}=await c.from('reviews').delete().eq('id',idOrIdx); return {error:error?.message||null}; }
      const list = loadLocal().reviews || []; list.splice(idOrIdx,1);
      setLocal('satsu_admin_reviews', list); return {error:null};
    },

    /* ---------- BLOG POSTS ---------- */
    async getPosts(){
      if(CONFIGURED){ const c=await ensureClient(); const {data,error}=await c.from('blog_posts').select('*').order('created_at',{ascending:false});
        if(error){console.error(error);return [];} return data; }
      return loadLocal().posts || [];
    },
    async savePost(p){
      if(CONFIGURED){ const c=await ensureClient();
        if(!p.slug) p.slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
        const {error}=await c.from('blog_posts').upsert(p); return {error: error?.message||null}; }
      const list = loadLocal().posts || [];
      if(!p.id) p.id = 'post-'+Math.random().toString(36).slice(2,9);
      const i = list.findIndex(x=>x.id===p.id);
      if(i>-1) list[i]=p; else list.push(p);
      setLocal('satsu_admin_posts', list); return {error:null};
    },
    async deletePost(id){
      if(CONFIGURED){ const c=await ensureClient(); const {error}=await c.from('blog_posts').delete().eq('id',id); return {error:error?.message||null}; }
      const list = (loadLocal().posts||[]).filter(p=>p.id!==id);
      setLocal('satsu_admin_posts', list); return {error:null};
    },

    /* ---------- BOOKINGS (customer-submitted) ---------- */
    async addBooking(booking){
      // booking: {customer_name, customer_phone, items: [{name,price}], total_price, notes}
      const payload = {...booking, items: JSON.stringify(booking.items||[])};
      if(CONFIGURED){ const c=await ensureClient(); const {error}=await c.from('bookings').insert(payload); return {error: error?.message||null}; }
      const list = loadLocal().bookings || [];
      list.unshift({...payload, id:'bk-'+Date.now(), status:'new', created_at:new Date().toISOString()});
      setLocal('satsu_local_bookings', list); return {error:null};
    },
    async getBookings(){
      if(CONFIGURED){ const c=await ensureClient(); const {data,error}=await c.from('bookings').select('*').order('created_at',{ascending:false});
        if(error){console.error(error);return [];}
        return data.map(b=>({...b, items: safeParse(b.items)})); }
      return (loadLocal().bookings||[]).map(b=>({...b, items: safeParse(b.items)}));
    },
    async updateBookingStatus(id, status){
      if(CONFIGURED){ const c=await ensureClient(); const {error}=await c.from('bookings').update({status}).eq('id',id); return {error:error?.message||null}; }
      const list = loadLocal().bookings||[]; const b=list.find(x=>x.id===id); if(b) b.status=status;
      setLocal('satsu_local_bookings', list); return {error:null};
    },

    /* ---------- SELL / TRADE-IN REQUESTS ---------- */
    async addSellRequest(req){
      if(CONFIGURED){ const c=await ensureClient(); const {error}=await c.from('sell_requests').insert(req); return {error: error?.message||null}; }
      const list = loadLocal().sellRequests || [];
      list.unshift({...req, id:'sr-'+Date.now(), status:'new', created_at:new Date().toISOString()});
      setLocal('satsu_local_sell', list); return {error:null};
    },
    async getSellRequests(){
      if(CONFIGURED){ const c=await ensureClient(); const {data,error}=await c.from('sell_requests').select('*').order('created_at',{ascending:false});
        if(error){console.error(error);return [];} return data; }
      return loadLocal().sellRequests || [];
    },

    /* ---------- CUSTOMERS (derived from bookings + sell requests) ---------- */
    async getCustomers(){
      if(CONFIGURED){
        const c=await ensureClient();
        const {data,error}=await c.from('customers').select('*').order('last_seen',{ascending:false});
        if(!error && data) return data;
      }
      // Fallback / derived view: build a simple customer list from local bookings + sell requests
      const {bookings=[], sellRequests=[]} = loadLocal();
      const map = {};
      [...bookings, ...sellRequests].forEach(r=>{
        const phone = r.customer_phone || r.phone;
        if(!phone) return;
        if(!map[phone]) map[phone] = {phone, name: r.customer_name || r.name, total_bookings:0};
        map[phone].total_bookings++;
      });
      return Object.values(map);
    },
  };

  function safeParse(v){ try{ return JSON.parse(v); }catch(e){ return []; } }

  window.SATSU_DB = DB;
})();
