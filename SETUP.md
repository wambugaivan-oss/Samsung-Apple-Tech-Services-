# Connecting Your Real Backend (Supabase) — Setup Guide

Right now the site works fully without this step — it just stores admin edits,
bookings, and sell requests in your own browser. Follow these steps whenever
you're ready to make everything sync live across every visitor and device.

## 1. Create your project
1. Go to https://supabase.com and sign up (free tier is enough to start).
2. Click "New Project". Pick any name/region, set a database password (save it somewhere safe), and wait ~2 minutes for it to spin up.

## 2. Create the database tables
1. In your new project, open **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open `supabase-schema.sql` (included alongside this file), copy all of it, paste it into the editor, and click **Run**.
4. This creates all the tables (services, banners, reviews, blog_posts, bookings, sell_requests, customers), sets up security rules, and pre-fills your current service catalogue so the site isn't empty on day one.

## 3. Get your API keys
1. Go to **Project Settings** (gear icon, bottom left) → **API**.
2. Copy the **Project URL**.
3. Copy the **anon public** key (NOT the "service_role" key — that one must stay secret and never go into website code).
4. Open `config.js` and paste both values in:
   ```js
   window.SATSU_CONFIG = {
     SUPABASE_URL: "https://yourproject.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi...",
   };
   ```
5. Save, re-upload `config.js` to wherever your site is hosted. That's it — the whole site is now live-connected.

## 4. Create your admin login
1. In Supabase, go to **Authentication** → **Users** → **Add User**.
2. Enter your own email and a strong password. Confirm the email if prompted (or toggle "Auto Confirm User" so you can log in immediately).
3. Go to `admin.html` on your site and sign in with that email/password.

You can add more staff logins the same way later.

## 5. What changes once this is connected
- **Services, banners, reviews, blog posts** — edited in `admin.html`, visible to every visitor immediately (previously: only visible in your own browser).
- **Bookings** — every cart checkout, service-page booking, and brand-page booking now writes a real row you can see in the admin Bookings tab, with customer name/phone when provided.
- **Sell requests** — every trade-in form submission is logged the same way.
- **Customers** — a running list built from bookings + sell requests.
- **Admin panel access** — now requires the login you created above; random visitors can't edit your site.

## 6. Hosting the site
This is a static site (plain HTML/CSS/JS) — no build step required. You can host it on:
- **Netlify** or **Vercel** (drag-and-drop the whole folder, free tier is fine)
- **GitHub Pages**
- Any regular web host (cPanel, etc.) — just upload all the files

Just make sure `config.js` (with your real keys) goes up with the rest of the files.

## Security notes
- The `anon` key is safe to expose in front-end code — Supabase is designed for this, and the row-level security rules in `supabase-schema.sql` control exactly what an unauthenticated visitor can and can't do (they can read services/banners/reviews and submit bookings, but cannot edit your prices or read other customers' data).
- Never put the `service_role` key anywhere in this codebase.
- If you ever suspect your `anon` key has leaked in a way that matters, you can regenerate it from Project Settings → API.
