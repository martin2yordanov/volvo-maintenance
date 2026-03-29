# 🚗 Volvo V70 Maintenance App

A cloud-synced car maintenance tracker. Data saved in **Supabase** (Postgres), hosted on **Vercel**, auto-deployed from **GitHub**.

## Architecture

```
GitHub (code) → Vercel (auto-deploy) → React SPA
                                          ↕
                                   Supabase (database)
                                   Anonymous Auth + RLS
```

**No backend server. No manual deployment. Edit code → push → live in ~30 seconds.**

---

## ⚡ Setup (One Time — ~20 minutes)

### Step 1 — Supabase (Database)

1. Go to [supabase.com](https://supabase.com) → **Start for free** → Sign up
2. **New project** → give it a name (e.g. `volvo-maintenance`) → choose a region → **Create project**
3. Wait ~2 minutes for the project to spin up
4. Go to **SQL Editor** → paste the contents of `supabase_schema.sql` → **Run**
5. Go to **Authentication** → **Providers** → find **Anonymous** → toggle it **ON** → Save
6. Go to **Project Settings** → **API**:
   - Copy **Project URL** → this is your `VITE_SUPABASE_URL`
   - Copy **anon / public** key → this is your `VITE_SUPABASE_ANON_KEY`

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
4. Add Supabase secrets to GitHub:
   - Go to your repo → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret** → add:
     - `VITE_SUPABASE_URL` = your Supabase Project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

---

### Step 3 — Vercel (Hosting + Auto-Deploy)

1. Go to [vercel.com](https://vercel.com) → **Sign Up** → **Continue with GitHub**
2. Click **Add New Project** → import your `volvo-maintenance` repo
3. Vercel auto-detects Vite. In **Environment Variables** add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
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

## 📱 How Data Sync Works

- On first open: app signs you in **anonymously** (no password needed)
- Your anonymous user ID is stored in the browser session
- All data is saved to Supabase under your user ID
- Open the app on any device with the same browser session → data is there
- To use on a **new device**: use the **↑ Експорт** button to save a JSON file, then **↓ Импорт** on the new device

> **Note:** Each device gets its own anonymous user unless you add proper authentication later.

---

## 🏗️ Project Structure

```
volvo-app/
├── src/
│   ├── App.jsx                 # Main app, Supabase auth + sync
│   ├── main.jsx                # React entry point
│   ├── index.css               # All styles
│   ├── lib/
│   │   ├── supabase.js         # Supabase client
│   │   └── data.js             # Default items + calculation logic
│   └── components/
│       ├── MainTable.jsx       # Sortable maintenance table
│       ├── NeedsAttention.jsx  # Overdue/due-soon view
│       ├── ThisYear.jsx        # Current year view
│       ├── Forecast.jsx        # 5-year forecast
│       ├── ItemModal.jsx       # Add/edit item form
│       ├── StatsRow.jsx        # Stats cards
│       └── Toast.jsx           # Notification toast
├── supabase_schema.sql         # Run once in Supabase SQL editor
├── .env.example                # Copy to .env for local dev
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
# Edit .env and add your Supabase credentials

# 4. Start dev server
npm run dev
# → App runs at http://localhost:5173
```

---

## 🆓 Free Tier Limits

| Service | Free Limit | Your Usage |
|---------|-----------|-----------|
| Vercel  | 100 GB bandwidth/month | ~< 1 MB/month |
| Supabase | 500 MB database, 50K MAU | ~< 1 MB, 1 user |
| GitHub  | Unlimited private repos | ✓ |

**You will never exceed free limits for personal use.**
