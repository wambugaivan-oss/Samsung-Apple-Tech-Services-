/* ============================================================================
   INVENTORY.JS — turns the compact inventory-data.js into a queryable catalogue.
   Every page that browses/searches/displays products includes this after
   inventory-data.js. Nothing here is invented — every field traces back to a
   row in ESSIMU_Full_Repair_Catalogue_v2.xlsx.
============================================================================ */
(function(){
  const raw = window.SATSU_INVENTORY_RAW;
  let ITEMS = null;

  function expand(){
    if(ITEMS) return ITEMS;
    const {T,B,M,C,P,D,rows} = raw;
    ITEMS = rows.map((r,i)=>({
      id: i,
      type: T[r[0]], brand: B[r[1]], model: M[r[2]], category: C[r[3]], part: P[r[4]],
      price: r[5], labor: r[6], total: r[7], duration: D[r[8]],
    }));
    return ITEMS;
  }

  /* Friendly display category — groups the spreadsheet's technical "Category"
     column into names customers actually search for. */
  function friendlyCategory(item){
    const p = item.part.toLowerCase();
    if(item.category==='Power' && p.includes('battery')) return 'Battery';
    if(item.category==='Power' && (p.includes('charging') || p.includes('port'))) return 'Charging Port';
    if(item.category==='Power') return 'Power';
    if(item.category==='Display') return 'Screen';
    if(item.category==='Housing') return 'Back Glass / Housing';
    if(item.category==='Camera') return 'Camera';
    if(item.category==='Audio') return 'Speaker / Microphone';
    if(item.category==='Core Electronics') return 'Motherboard / Core';
    if(item.category==='Mechanical') return 'Buttons / Mechanical';
    if(item.category==='Flex Cables') return 'Flex Cable';
    if(item.category==='Connectivity') return 'Connectivity';
    if(item.category==='Cooling') return 'Cooling';
    if(item.category==='Storage') return 'Storage';
    if(item.category==='Accessories') return 'Accessory';
    return item.category;
  }

  /* Icon key used to pick a representative inline-SVG illustration. Kept to a
     small fixed set so the whole 3,000+ item catalogue costs zero extra
     image requests. */
  function iconKey(item){
    const fc = friendlyCategory(item);
    const typeMap = {
      'TV':'tv','Laptop':'laptop','Tablet':'tablet','Smartwatch':'watch',
      'Earbuds & Audio':'earbuds','Gaming Console':'console','Desktop/PC':'pc',
      'Power Bank':'powerbank','Router/Modem':'router','Accessories':'accessory'
    };
    if(typeMap[item.type]) return typeMap[item.type];
    const catMap = {
      'Screen':'screen','Battery':'battery','Charging Port':'plug','Back Glass / Housing':'backglass',
      'Camera':'camera','Speaker / Microphone':'speaker','Motherboard / Core':'chip',
      'Buttons / Mechanical':'button','Flex Cable':'cable','Connectivity':'signal',
      'Cooling':'fan','Storage':'disk','Accessory':'accessory','Power':'battery'
    };
    return catMap[fc] || 'phone';
  }

  function isRetail(item){ return item.type==='Accessories' || item.duration.toLowerCase().includes('retail'); }

  const DB = {
    all(){ return expand(); },
    getById(id){ return expand()[id]; },
    friendlyCategory, iconKey, isRetail,

    /* facets for building filter UIs */
    facets(){
      const items = expand();
      const types = [...new Set(items.map(i=>i.type))].sort();
      const brands = [...new Set(items.map(i=>i.brand))].sort();
      const cats = [...new Set(items.map(i=>friendlyCategory(i)))].sort();
      return {types, brands, cats};
    },
    brandsForType(type){
      return [...new Set(expand().filter(i=>i.type===type).map(i=>i.brand))].sort();
    },
    modelsForBrand(brand, type){
      let items = expand().filter(i=>i.brand===brand);
      if(type) items = items.filter(i=>i.type===type);
      return [...new Set(items.map(i=>i.model))];
    },

    /* Core search/filter used by catalogue.html */
    query({type, brand, model, cat, q, minPrice, maxPrice} = {}){
      let items = expand();
      if(type) items = items.filter(i=>i.type===type);
      if(brand) items = items.filter(i=>i.brand===brand);
      if(model) items = items.filter(i=>i.model===model);
      if(cat) items = items.filter(i=>friendlyCategory(i)===cat);
      if(minPrice) items = items.filter(i=>i.total>=Number(minPrice));
      if(maxPrice) items = items.filter(i=>i.total<=Number(maxPrice));
      if(q){
        const needle = q.toLowerCase().trim();
        items = items.filter(i=>
          i.model.toLowerCase().includes(needle) ||
          i.part.toLowerCase().includes(needle) ||
          i.brand.toLowerCase().includes(needle) ||
          friendlyCategory(i).toLowerCase().includes(needle)
        );
      }
      return items;
    },
    stats(){
      const items = expand();
      const brands = new Set(items.map(i=>i.brand));
      const models = new Set(items.map(i=>i.brand+'|'+i.model));
      return {total: items.length, brands: brands.size, models: models.size};
    },
  };
  window.SATSU_INV = DB;
})();
