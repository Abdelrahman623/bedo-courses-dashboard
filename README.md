# 🎓 Bedo Courses & Learning Roadmap Dashboard

A bespoke, high-performance personal learning command center engineered with **React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, D3.js, Recharts, TipTap, Zustand, and Supabase**.

Designed with the **"Midnight Scholar"** aesthetic: deep midnight obsidian backgrounds, warm amber accents, mint green success states, coral alerts, and fluid physical motion.

---

## ✨ Features & Tabs

| Tab | Feature Highlights |
|---|---|
| **🏠 Overview (Home)** | Welcome banner with dynamic day greeting, motivational quote, 3 animated SVG progress rings, current & longest study streaks, 26-week GitHub-style activity heatmap, "Today's Focus" smart card, and quick-action shortcuts. |
| **🗺 Courses & Roadmap** | **Interactive D3.js Force-Directed Graph** representing the complete Data Analyst roadmap (70+ interconnected nodes across 6 learning phases). Pan, zoom, click any node to open the Slide-Over inspector and toggle status (`Not Started` ↔ `In Progress` ↔ `Completed`). Toggle to Courses view to track high-level curriculum progress and add new courses. |
| **📝 Notes** | Notion-style rich-text editor powered by **TipTap**. Full Markdown formatting, headings (H1–H3), code blocks, bulleted lists, interactive task checklists, text highlights, tag categorization, real-time debounced auto-save, and search. |
| **🚀 Projects** | Track both **Course Projects** and **Independent Projects**. Dual view modes: responsive card grid and 4-column **Kanban Board** (`Idea`, `In Progress`, `Completed`, `Deployed`). Direct repository, demo, and local folder path links with animated progress indicators. |
| **⏱ Time Tracker** | Custom **Pomodoro Focus Timer** (25-minute cycle with SVG circular sweep animation), start/pause/stop session recording, weekly 10-hour goal progress bar, 7-day study breakdown bar chart, recent sessions history, and manual log modal. |
| **📊 Analytics** | 12-week learning velocity line chart, 6-phase skill coverage radar chart, estimated completion date projection, and weekly study distribution analysis. |
| **⚙ Settings** | Profile personalization, real-time Supabase connection diagnostics, interactive Midnight Scholar theme swatches, and one-click data export to JSON and Markdown. |
| **🔐 Authentication** | **Option B: Supabase Auth** with Email/Password + Google OAuth support, password reset, and instant **Guest/Demo Mode** for zero-setup offline usage. |

---

## 🎨 Design System: "Midnight Scholar"

- **Base Background**: `#0D0F14` (Midnight Obsidian)
- **Surface**: `#161A23` (Charcoal Slate)
- **Elevated Surface**: `#1E2433` (Deep Navy Tint)
- **Primary Accent**: `#F0A500` (Warm Amber / Gold)
- **Success Accent**: `#00C896` (Mint Emerald)
- **Alert Accent**: `#FF6B6B` (Vibrant Coral)
- **Info Accent**: `#4FC3F7` (Sky Blue)
- **Typography**: Inter (sans-serif) & JetBrains Mono (monospace)

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

> **Tip:** If you haven't set up Supabase yet, simply click **"Explore as Guest / Demo Mode"** on the login screen to access and test all 7 tabs immediately!

### 3. Production Build
```bash
npm run build
```

---

## 🗄 Supabase Setup & Database Migration

To sync your study sessions, notes, roadmaps, and projects to the cloud:

### 1. Create a Supabase Project
1. Go to [database.new](https://database.new) and create a new project.
2. Under **Project Settings → API**, copy:
   - **Project URL**
   - **Project API Anon Key**

### 2. Configure Environment Variables
Create a file named `.env` in the project root (or copy `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 3. Run Database Setup
1. In the Supabase Dashboard, navigate to the **SQL Editor**.
2. Open [`supabase_setup.sql`](./supabase_setup.sql) from this repository — it's the single file that sets up everything (tables, RLS, admin roles, user management). Safe to re-run any time.
3. Paste the entire content into the SQL Editor and click **Run**.
4. Scroll to **section 10** and run the one `UPDATE` line with your own email — that's what makes your account an admin.
5. This creates all 9 tables with proper indexes, constraints, and Row Level Security (RLS) rules:
   - `profiles`
   - `roadmaps`
   - `courses`
   - `topics`
   - `notes`
   - `projects`
   - `sessions`
   - `daily_activity`
   - `user_state`

### 4. Enable Google Sign-In (Optional)
1. In the Supabase Dashboard, go to **Authentication → Providers → Google**.
2. Toggle Google to **Enabled**.
3. Create OAuth 2.0 Credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
4. Add the Authorized Redirect URI provided by Supabase.
5. Paste your `Client ID` and `Client Secret` into the Supabase Google Provider settings.

---

## 🗺 Customizing the Roadmap

The default roadmap is initialized with the full 70+ node Data Analyst curriculum based on your mind-map:
- **Phase 1: Foundation** (Math, Statistics, Business Knowledge, Problem Solving)
- **Phase 2: Excel** (Functions, Pivot Tables, Dashboards, Power Query)
- **Phase 3: SQL & Programming** (SQL Queries, Python Fundamentals, Pandas, NumPy, Data Cleaning)
- **Phase 4: Data Handling & Visualization** (APIs, Web Scraping, Tableau, Power BI)
- **Phase 5: Analytics Techniques** (Exploratory Data Analysis, Hypothesis Testing, Storytelling)
- **Phase 6: Advanced** (Machine Learning Foundations, Scikit-Learn, Big Data)

You can customize or extend nodes in:
[`src/data/dataAnalystRoadmap.ts`](./src/data/dataAnalystRoadmap.ts)

---

## 📁 Project Architecture

```
Bedo_Courses_Dashboard/
├── public/
│   └── favicon.svg                # Brand icon
├── src/
│   ├── components/
│   │   ├── analytics/             # Heatmap & analytics charts
│   │   ├── layout/                # Sidebar, TopBar, AppLayout
│   │   ├── roadmap/               # D3 Force-directed graph & slide-over
│   │   └── ui/                    # Button, Card, Badge, Modal, ProgressRing, SlideOver
│   ├── data/
│   │   └── dataAnalystRoadmap.ts  # 70+ seed nodes, phases, & connections
│   ├── hooks/
│   │   └── useAuth.tsx            # Supabase auth & demo mode provider
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client with offline detection
│   │   └── utils.ts               # Date math, ring offset, streak calculations
│   ├── pages/
│   │   ├── Analytics.tsx          # Velocity, radar, and pace analytics
│   │   ├── Courses.tsx            # D3 interactive roadmap & course manager
│   │   ├── Home.tsx               # Overview dashboard
│   │   ├── Login.tsx              # Supabase email/password + Google auth
│   │   ├── Notes.tsx              # TipTap rich text Notion-like editor
│   │   ├── Projects.tsx           # Grid & Kanban project manager
│   │   ├── Settings.tsx           # Config, export, & theme settings
│   │   └── Tracker.tsx            # Pomodoro timer & study logging
│   ├── store/
│   │   ├── notesStore.ts          # Zustand notes store with debounced auto-save
│   │   ├── projectsStore.ts       # Zustand projects store
│   │   ├── roadmapStore.ts        # Zustand roadmap & topic state store
│   │   └── sessionStore.ts        # Zustand timer & streak store
│   ├── types/
│   │   └── index.ts               # Comprehensive TypeScript interfaces
│   ├── App.tsx                    # Routes & protected route guard
│   ├── index.css                  # Tailwind styles, CSS variables, & animations
│   └── main.tsx                   # React 19 entry point
├── .env.example                   # Supabase environment variables template
├── supabase_setup.sql              # Complete DB setup: tables, RLS, admin roles (single file)
├── tailwind.config.js             # Midnight Scholar design tokens
└── vite.config.ts                 # Vite bundler configuration
```

---

*Handcrafted for Bedo. Built for continuous personal mastery.*
