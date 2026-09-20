# Bedo Courses Dashboard — Master Prompt & Project Reference

> **Last Updated**: 2026-09-18  
> **Project Folder**: `d:\Projects\Bedo_Courses_Dashboard`  
> **Status**: Planning Phase — awaiting user approval before building

---

## What This Is

A personal, interactive, Supabase-connected learning dashboard for tracking:
- Progress through structured learning roadmaps (e.g. Data Analyst path)
- Course-specific and independent projects
- Study notes (Notion-style rich text)
- Time spent studying
- Personal analytics and streaks

The UI must feel **handcrafted** — not AI-generated. It uses a dark "Midnight Scholar" color theme with warm amber, mint green, and coral accents on a near-black background.

---

## Build Prompt (for agent or developer)

Build a **React + Vite + TypeScript** personal learning dashboard called **"Bedo Courses Dashboard"** with the following specifications:

### Tech Stack
- **React 18 + Vite + TypeScript**
- **Tailwind CSS** with custom design tokens (CSS variables)
- **Framer Motion** for all animations
- **Recharts** for bar/line/pie charts, **D3.js** for the interactive roadmap graph
- **Supabase** (PostgreSQL + Auth + Realtime) for the backend
- **Zustand** for global state management
- **TipTap** for the rich-text note editor
- **React Router v6** for tab navigation
- **Lucide React** for icons

### Color Theme — "Midnight Scholar"
```css
--bg-base:       #0D0F14;
--bg-surface:    #161A23;
--bg-surface-2:  #1E2433;
--accent-amber:  #F0A500;
--accent-mint:   #00C896;
--accent-coral:  #FF6B6B;
--accent-sky:    #4FC3F7;
--text-primary:  #E8EAF0;
--text-secondary:#8A94A8;
--text-muted:    #4A5568;
```

### 7 Dashboard Tabs

1. **Home / Overview** — Welcome banner, animated SVG progress rings, GitHub-style streak heatmap, quick-add panel, Today''s Focus card
2. **Courses & Roadmap** — Interactive D3 node-graph roadmap (clickable topics, color-coded by status), course progress cards, Add Course modal
3. **Notes** — TipTap rich-text editor linked to course/topic, tree-view sidebar, full-text search (Supabase FTS), tags, auto-save
4. **Projects** — Course projects + independent projects, kanban board view (drag & drop), status badges, GitHub/demo links, tech stack tags
5. **Time Tracker** — Pomodoro timer, manual session logging, weekly bar chart, monthly heatmap, per-course pie chart, weekly goal progress bar
6. **Analytics** — Learning velocity line chart, radar chart of skill areas, streak stats, estimated completion date
7. **Settings** — Profile, Supabase status, theme toggle, roadmap manager, data export (JSON/Markdown), reset progress

### Supabase Database Schema
```sql
profiles       (id, name, avatar_url, bio, weekly_goal_hours, created_at)
roadmaps       (id, user_id, title, description, image_url, created_at)
courses        (id, user_id, roadmap_id, title, source_url, start_date, status, created_at)
topics         (id, course_id, title, parent_topic_id, position_x, position_y, status, created_at)
notes          (id, user_id, course_id, topic_id, title, content, tags[], updated_at, created_at)
projects       (id, user_id, course_id, title, description, status, tech_stack[],
                github_url, demo_url, local_path, completion_pct, created_at, updated_at)
sessions       (id, user_id, course_id, topic_id, start_time, end_time, duration_mins, notes, created_at)
daily_activity (id, user_id, date, total_mins, topics_completed, created_at)
```
