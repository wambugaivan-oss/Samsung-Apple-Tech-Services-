// ============================================================================
// CRM SHARED HELPERS
// Loaded on every /crm/ page after config.js and the Supabase CDN script.
// Expects window.SATSU_CONFIG = { SUPABASE_URL, SUPABASE_ANON_KEY } from ../config.js
// ============================================================================

const SB = window.supabase.createClient(
  window.SATSU_CONFIG.SUPABASE_URL,
  window.SATSU_CONFIG.SUPABASE_ANON_KEY
);

const fmtUGX = (n) =>
  "UGX " + Math.round(Number(n) || 0).toLocaleString("en-UG");

const NAV_ITEMS = [
  { href: "dashboard.html", label: "Dashboard", icon: "📊" },
  { href: "customers.html", label: "Customers", icon: "👤" },
  { href: "products.html", label: "Products & Inventory", icon: "📦" },
  { href: "sales.html", label: "Sales (POS)", icon: "🧾" },
  { href: "repairs.html", label: "Repairs", icon: "🔧" },
];

// Redirects to login if no active session. Call at the top of every protected page.
async function requireAuth() {
  const { data: { session } } = await SB.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session;
}

function renderNav(activeHref) {
  const nav = document.getElementById("crm-nav");
  if (!nav) return;
  const current = window.location.pathname.split("/").pop();
  nav.innerHTML = `
    <div class="crm-brand">Samsung Apple Tech <span>CRM</span></div>
    <div class="crm-nav-links">
      ${NAV_ITEMS.map(item => `
        <a href="${item.href}" class="crm-nav-link ${current === item.href ? "active" : ""}">
          <span class="crm-nav-icon">${item.icon}</span>${item.label}
        </a>`).join("")}
    </div>
    <button id="crm-logout" class="crm-logout-btn">Log out</button>
  `;
  document.getElementById("crm-logout").addEventListener("click", async () => {
    await SB.auth.signOut();
    window.location.href = "login.html";
  });
}

function toast(msg, isError) {
  let el = document.getElementById("crm-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "crm-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = "crm-toast show" + (isError ? " error" : "");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3000);
}

function genReceiptNumber() {
  const d = new Date();
  const stamp = d.toISOString().slice(2, 10).replace(/-/g, "");
  return "RCT-" + stamp + "-" + Math.floor(Math.random() * 900 + 100);
}

function genRepairNumber() {
  const d = new Date();
  const stamp = d.toISOString().slice(2, 10).replace(/-/g, "");
  return "REP-" + stamp + "-" + Math.floor(Math.random() * 900 + 100);
}