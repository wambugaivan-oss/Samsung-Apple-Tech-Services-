-- ============================================================================
-- SAMSUNG APPLE TECH SERVICES UGANDA — SUPABASE SCHEMA
-- ============================================================================
-- HOW TO USE:
-- 1. Create a free project at https://supabase.com
-- 2. Open the SQL Editor in your Supabase dashboard → New Query
-- 3. Paste this entire file in and click "Run"
-- 4. Go to Project Settings → API and copy your "Project URL" and "anon public" key
-- 5. Paste those two values into config.js (see that file for exactly where)
-- 6. Create your admin login: Authentication → Users → Add User (use your own
--    email + a strong password). That's what you'll use to sign in to admin.html.
-- ============================================================================

-- SERVICES (repairs & pricing shown on the homepage / service pages)
create table if not exists services (
  id text primary key,
  name text not null,
  brand text,
  cat text,
  time text,
  warranty text,
  price integer not null default 0,
  updated_at timestamptz default now()
);

-- HOMEPAGE BANNERS (rotating hero promo slides)
create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  tag text,
  title text not null,
  description text,
  cta_text text,
  sort_order integer default 0,
  updated_at timestamptz default now()
);

-- CUSTOMER REVIEWS
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  review_text text not null,
  rating integer default 5,
  created_at timestamptz default now()
);

-- BLOG POSTS
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  body text,
  created_at timestamptz default now()
);

-- BOOKINGS (submitted by customers from the site)
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_phone text,
  items text,               -- JSON string of {name, price} the customer booked
  total_price integer,
  status text default 'new',-- new | contacted | in_progress | completed | cancelled
  notes text,
  created_at timestamptz default now()
);

-- SELL / TRADE-IN REQUESTS
create table if not exists sell_requests (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_phone text,
  device text,
  condition text,
  notes text,
  status text default 'new',
  created_at timestamptz default now()
);

-- CUSTOMERS (built up automatically from bookings + sell requests)
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text unique,
  total_bookings integer default 0,
  first_seen timestamptz default now(),
  last_seen timestamptz default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Public visitors can READ services/banners/reviews/blog_posts, and can INSERT
-- bookings/sell_requests (i.e. submit a form) — but cannot read other people's
-- bookings, and cannot edit services/pricing/reviews unless logged in as admin.
-- ============================================================================
alter table services enable row level security;
alter table banners enable row level security;
alter table reviews enable row level security;
alter table blog_posts enable row level security;
alter table bookings enable row level security;
alter table sell_requests enable row level security;
alter table customers enable row level security;

-- Public read access (what visitors need to see the site)
create policy "public read services" on services for select using (true);
create policy "public read banners" on banners for select using (true);
create policy "public read reviews" on reviews for select using (true);
create policy "public read blog_posts" on blog_posts for select using (true);

-- Public can submit bookings and sell requests, but not read them back
create policy "public insert bookings" on bookings for insert with check (true);
create policy "public insert sell_requests" on sell_requests for insert with check (true);
create policy "public insert customers" on customers for insert with check (true);

-- Only logged-in admin (any authenticated user) can write to content tables
create policy "admin write services" on services for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write banners" on banners for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write reviews" on reviews for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write blog_posts" on blog_posts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Only logged-in admin can read/update bookings, sell_requests and customers
create policy "admin read bookings" on bookings for select using (auth.role() = 'authenticated');
create policy "admin update bookings" on bookings for update using (auth.role() = 'authenticated');
create policy "admin read sell_requests" on sell_requests for select using (auth.role() = 'authenticated');
create policy "admin update sell_requests" on sell_requests for update using (auth.role() = 'authenticated');
create policy "admin read customers" on customers for select using (auth.role() = 'authenticated');
create policy "admin update customers" on customers for update using (auth.role() = 'authenticated');

-- ============================================================================
-- SEED DATA (your current service catalogue, so the site isn't empty on launch)
-- ============================================================================
insert into services (id,name,brand,cat,time,warranty,price) values
  ('iph-screen','iPhone Screen Replacement','Apple','Screen','30–45 min','30 days',220000),
  ('sam-screen','Samsung Galaxy Screen Replacement','Samsung','Screen','30–45 min','30 days',190000),
  ('iph-batt','iPhone Battery Replacement','Apple','Battery','20–30 min','30 days',135000),
  ('and-batt','Android Battery Replacement','Android','Battery','20–30 min','30 days',65000),
  ('charge-port','Charging Port Repair','All Brands','Charging','20–30 min','30 days',65000),
  ('water','Water Damage Recovery','All Brands','Water','2–24 hrs','14 days',95000),
  ('software','Software Repair & Unlocking','All Brands','Software','20–60 min','7 days',40000),
  ('data','Data Recovery','All Brands','Data','1–3 hrs','—',75000),
  ('cam','Camera Module Replacement','All Brands','Camera','20–30 min','30 days',110000)
on conflict (id) do nothing;

insert into banners (tag,title,description,cta_text,sort_order) values
  ('This Week','iPhone Screens From UGX 220,000','Genuine-quality displays, fitted in under 45 minutes.','From UGX 220,000',1),
  ('Bundle Deal','Battery + Diagnostics','Free full device check with every battery replacement.','From UGX 65,000',2),
  ('Trade-In','Sell Your Old Device Today','Instant valuation, same-day cash or store credit.','Get a quote →',3)
on conflict do nothing;

insert into reviews (name, review_text) values
  ('Nakato Judith','Cracked my iPhone 14 screen and it was fixed in under an hour — looks brand new.'),
  ('Wamono Peter','Sent my Samsung from Mbale for software repair, got it back the same day. Excellent service.')
on conflict do nothing;
