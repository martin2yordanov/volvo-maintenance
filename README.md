# 🚗 Volvo V70 Maintenance App

A car maintenance tracker. Login via **Clerk**, data stored per-user in the browser (localStorage) and mirrored to the Clerk user's metadata. Hosted on **Vercel**, auto-deployed from **GitHub**.

## Architecture

```
GitHub (code) → Vercel (auto-deploy) → React SPA
                                          ↕
                                   Clerk (authentication)
                              localStorage + Clerk user metadata
```

**No backend server. No manual deployment. Edit code → push → live in ~30 seconds.**

---

## ⚡ Setup (One Time — ~20 minutes)

### Step 1 — Clerk (Authentication)

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → **Sign up** → **Create application**
2. Name it (e.g. `volvo-maintenance`), pick the sign-in methods you want (Email is enough) → **Create**
3. Go to **API Keys**:
   - Copy the **Publishable key** (`pk_test_…` / `pk_live_…`) → this is your `VITE_CLERK_PUBLISHABLE_KEY`
4. (Optional) Under **Paths**, the default Account Portal works out of the box; no extra config needed for this SPA.

---

### Step 2 — GitHub (Code Storage)

1. Go to [github.com](https://github.com) → Sign in (or create free account)
2. Click **+** → **New repository**
   - Name: `volvo-maintenance`
   - Visibility: **Private** ✓
   - Click **Create repository**
3. Upload all project files:
   - Click **Add file** → **Upload files**
   - Drag the entire project folder contents
   - Click **Commit changes**
4. Add the Clerk key to GitHub (only needed if you build in CI):
   - Go to your repo → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret** → add:
     - `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk publishable key

---

### Step 3 — Vercel (Hosting + Auto-Deploy)

1. Go to [vercel.com](https://vercel.com) → **Sign Up** → **Continue with GitHub**
2. Click **Add New Project** → import your `volvo-maintenance` repo
3. Vercel auto-detects Vite. In **Environment Variables** add:
   - `VITE_CLERK_PUBLISHABLE_KEY` = your Clerk publishable key
4. Click **Deploy** → wait ~60 seconds
5. Your app is live at `https://volvo-maintenance-xxx.vercel.app`
6. Optional: go to **Settings** → **Domains** → set a custom name like `volvo-v70.vercel.app`

---

## 🔄 Updating the App (After Setup)

```
Edit any file locally → git push → Vercel auto-deploys in ~30 seconds
```

Or directly on GitHub:
1. Open the file on GitHub
2. Click the pencil ✎ icon
3. Edit and **Commit changes**
4. Vercel picks up the change and deploys automatically

---

## 📱 How Login & Data Works

- On first open: you **sign in / sign up** with Clerk (email).
- New accounts are seeded with the default Volvo V70 maintenance schedule.
- Data is saved in the browser (**localStorage**) namespaced per Clerk user id.
- It's also **mirrored to your Clerk user metadata** so it follows your account to other devices — as long as it fits Clerk's ~8 KB metadata cap. Beyond that, data stays local on each device (the sync dot shows "локално").
- For a guaranteed backup/transfer: use **↑ Експорт** to save a JSON file, then **↓ Импорт** elsewhere.

> **Note:** Because Clerk metadata is capped at ~8 KB, large datasets (lots of service-log entries, documents, or several cars) won't fully sync across devices. Use Export/Import for those.

---

## 🏗️ Project Structure

```
volvo-app/
├── src/
│   ├── App.jsx                 # Main app, Clerk auth + local persistence
│   ├── main.jsx                # React entry point (ClerkProvider)
│   ├── index.css               # All styles
│   ├── lib/
│   │   └── data.js             # Default items + calculation logic
│   └── components/
│       ├── MainTable.jsx       # Sortable maintenance table
│       ├── NeedsAttention.jsx  # Overdue/due-soon view
│       ├── ThisYear.jsx        # Current year view
│       ├── Forecast.jsx        # 5-year forecast
│       ├── ItemModal.jsx       # Add/edit item form
│       ├── StatsRow.jsx        # Stats cards
│       └── Toast.jsx           # Notification toast
├── .env.example                # Copy to .env for local dev (Clerk key)
├── vercel.json                 # Vercel SPA routing config
├── vite.config.js              # Vite build config
└── package.json
```

---

## 💻 Local Development

```bash
# 1. Clone your repo
git clone https://github.com/YOUR_USERNAME/volvo-maintenance.git
cd volvo-maintenance

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
# Edit .env and add your Clerk publishable key (VITE_CLERK_PUBLISHABLE_KEY)

# 4. Start dev server
npm run dev
# → App runs at http://localhost:5173
```

---

## 🆓 Free Tier Limits

| Service | Free Limit | Your Usage |
|---------|-----------|-----------|
| Vercel  | 100 GB bandwidth/month | ~< 1 MB/month |
| Clerk   | 10,000 monthly active users | 1 user |
| GitHub  | Unlimited private repos | ✓ |

**You will never exceed free limits for personal use.**
