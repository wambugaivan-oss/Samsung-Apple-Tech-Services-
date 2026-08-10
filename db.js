/* ============================================================================
   DB.JS — shared data layer for the whole site.
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

    async signIn(email, password){
      const c = await ensureClient(); if(!c) return {error:"Backend not configured yet — see config.js"};
      const {data,error} = await c.auth.signInWithPassword({email,password});
      return {data, error: error ? error.message : null};
    },
    async signOut(){ const c = await ensureClient(); if(c) await c.auth.signOut(); },
    async currentUser(){ const c = await ensureClient(); if(!c) return null; const {data} = await c.auth.getUser(); return data?.user || null; },

    async uploadMedia(file, folder){
      if(!CONFIGURED) return {url:null, error:"Backend not configured yet — see config.js"};
      if(!file) return {url:null, error:"No file selected"};
      const c = await ensureClient();
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const {error} = await c.storage.from('media').upload(path, file, {cacheControl:'3600', upsert:false});
      if(error) return {url:null, error: error.message};
      const {data} = c.storage.from('media').getPublicUrl(path);
      return {url: data.publicUrl, error:null};
    },

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

    async getBanners(){
      if(CONFIGURED){ const c=await ensureClient(); const {data,error}=await c.from('banners').select('*').order('sort_order');
        if(error){console.error(error);return [];}
        return data.map(b=>({id:b.id,tag:b.tag,title:b.title,desc:b.description,price:b.cta_text,image:b.image_url})); }
      return loadLocal().banners || null;
    },
    async saveBanner(b, idx){
      if(CONFIGURED){ const c=await ensureClient();
        const row = {tag:b.tag, title:b.title, description:b.desc, cta_text:b.price, image_url:b.image||null};
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

    async addBooking(booking){
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

    async getCustomers(){
      if(CONFIGURED){
        const c=await ensureClient();
        const {data,error}=await c.from('customers').select('*').order('last_seen',{ascending:false});
        if(!error && data) return data;
      }
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

    /* ---------- SHOP PRODUCTS (bridges the CRM's "Products & Inventory" into the public site) ---------- */
    /* Read-only from the public side — products are added via /crm/products.html by staff.
       Only returns products that actually have stock, so nothing "out of stock" is shown. */
    async getShopProducts(){
      if(!CONFIGURED) return []; // this feature only exists once Supabase is connected
      const c = await ensureClient();
      const {data, error} = await c.from('products')
        .select('*, brands(name), categories(name), inventory_stock(quantity_on_hand)')
        .order('created_at', {ascending:false});
      if(error){ console.error(error); return []; }
      const withStock = await Promise.all((data||[]).map(async p=>{
        const {count} = await c.from('inventory_items').select('id',{count:'exact',head:true}).eq('product_id', p.id).eq('status','in_stock');
        const onHand = (p.inventory_stock && p.inventory_stock[0] && p.inventory_stock[0].quantity_on_hand) || 0;
        return {
          id: p.id, name: p.name, model: p.model, brand: p.brands ? p.brands.name : null,
          category: p.categories ? p.categories.name : null, price: p.selling_price,
          image: p.image_url || null, stock: (count||0) + onHand,
        };
      }));
      return withStock.filter(p => p.stock > 0);
    },

    /* ---------- CRM OVERVIEW (for the admin.html Overview dashboard) ---------- */
    /* Pulls live business numbers from the CRM's tables (Products, Sales, Repairs,
       Customers). Read-only from this side — everything is managed in /crm/. */
    async getCrmOverview(){
      if(!CONFIGURED) return null;
      const c = await ensureClient();
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
      try{
        const [products, lowStockCheck, salesToday, salesMonth, activeRepairs, readyRepairs, crmCustomers] = await Promise.all([
          c.from('products').select('id', {count:'exact', head:true}),
          c.from('inventory_stock').select('product_id, quantity_on_hand, reorder_level'),
          c.from('sales').select('total', {count:'exact'}).gte('created_at', todayStart.toISOString()),
          c.from('sales').select('total').gte('created_at', monthStart.toISOString()),
          c.from('repairs').select('id', {count:'exact', head:true}).in('status', ['received','diagnosing','in_progress','awaiting_parts']),
          c.from('repairs').select('id', {count:'exact', head:true}).eq('status','ready'),
          c.from('customers').select('id', {count:'exact', head:true}),
        ]);
        const lowStockCount = (lowStockCheck.data||[]).filter(s => s.quantity_on_hand <= (s.reorder_level ?? 3)).length;
        const salesTodayTotal = (salesToday.data||[]).reduce((s,r)=>s+(r.total||0),0);
        const salesMonthTotal = (salesMonth.data||[]).reduce((s,r)=>s+(r.total||0),0);
        return {
          productCount: products.count || 0,
          lowStockCount,
          salesTodayCount: salesToday.count || 0,
          salesTodayTotal, salesMonthTotal,
          activeRepairs: activeRepairs.count || 0,
          readyRepairs: readyRepairs.count || 0,
          crmCustomers: crmCustomers.count || 0,
        };
      }catch(e){
        console.error('CRM overview fetch failed — have you run crm-full-bridge.sql yet?', e);
        return null;
      }
    },
  };

  function safeParse(v){ try{ return JSON.parse(v); }catch(e){ return []; } }

  window.SATSU_DB = DB;
})();