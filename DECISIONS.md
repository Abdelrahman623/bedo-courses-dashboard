# Decisions log

Short-lived record of calls made during the Academic/Courses mode rework that
aren't obvious from the code or the master plan. Append, don't rewrite.

---

## Tier 2 — guest-mode → cloud sync story for schedule/assessments/grades

**Question**: now that there's more per-course state (schedule, assessments,
grades), what happens to it for a signed-out / unconfigured-Supabase user,
and does anything need to migrate when they sign in?

**Finding**: the app has no guest-to-account migration path today, for
anything. `getActiveUserId()` returns `null` whenever Supabase isn't
configured or nobody's signed in, and `addCourse` / `addTemplateAsCourse`
both no-op (or throw, caught silently) without a user id — a signed-out
visitor cannot create a `courses` row at all in the current build. The one
thing that *does* work while signed out is the roadmap canvas
(`localNodes`/`localEdges` in `roadmapStore`), which lives purely in memory
and is discarded on refresh; `queueUserState`/`saveUserState` are no-ops
without a session, by design (see `userState.ts`'s comments).

**Decision**: schedule/assessments/grades follow the *canvas* pattern, not
the *course* pattern — they always update local Zustand state immediately
(so the UI works fully offline, per the constraint in the master plan), and
only sync to Supabase when `isSupabaseConfigured` is true. They do **not**
gate on `getActiveUserId()` the way `addCourse` does, because they're keyed
to a `course_id`, not a `user_id` — if the course they belong to couldn't be
created without a session, gating them the same way would be redundant, not
protective.

**What this means in practice**: in a genuinely guest/unconfigured session,
schedule/assessment/grade edits behave exactly like unsaved canvas edits —
they're visible and interactive for the session, then gone on refresh. No
new migration logic was added, because there's no existing "local → cloud"
migration for courses to extend in the first place. If a real
guest-mode-with-persistence story is wanted later (e.g. localStorage staging
that gets pushed to Supabase on first sign-in), that's new scope beyond this
rework and should be its own tiered task — it would need to cover `courses`
and the canvas too, not just the three new Academic tables.

**Supabase schema**: delivered as `supabase_migration_academic_mode.sql`
(Tier 0) — `courses.mode`/`courses.source` columns plus the `schedule`,
`assessments`, `grades` tables, RLS scoped through `courses` the same way
`topics` already is.

## Tier 1 — patch-file cleanup

**Task**: reconcile `changes.patch`, `courses_fix.patch`, `fix_changes.patch`,
`mobile_ui_fix2.patch` so repo state is unambiguous.

**Finding**: none of the four applied cleanly against the current tree
(`git apply --check` failed on all four — line numbers and surrounding
context had moved). Rather than force-apply and risk duplicating or
reverting work, each patch's actual content was checked against the current
files by hand:

| Patch | Target(s) | Status |
|---|---|---|
| `changes.patch` | `index.css`, `Analytics.tsx`, `Home.tsx`, `Notes.tsx`, `Projects.tsx` | Every hunk already present — the project-range slider CSS, the Analytics portfolio-progress bar, the Notes `?project=`/`?new=1` deep-linking, and the Projects rewrite (status↔completion reconciliation, course linking, `SlideOver` detail view) are all in the current files, some of them now living in `src/pages/home/CoursesHome.tsx` after the Tier 3 `Home.tsx` split rather than in `Home.tsx` itself. |
| `courses_fix.patch` | `Courses.tsx` | Already present — the `flex-col sm:flex-row` responsive fix is in the file as written. |
| `fix_changes.patch` | `index.html`, `AppLayout.tsx`, `index.css`, `roadmapStore.ts` | Already present — `viewport-fit=cover`, `100dvh`, the safe-area bottom padding, and the full `progressByTemplate` per-path-progress feature (including the migration backfill) are all in place. |
| `mobile_ui_fix2.patch` | `RoadmapGraph.tsx`, `Settings.tsx` | Already present — both zoom-floor fixes read `0.15`, and the Settings connection pill / user rows already wrap responsively. |

**Decision**: deleted all four (`git rm`). They were stale artifacts of an
earlier, less disciplined workflow (generating a patch instead of committing
directly) — every change they describe was independently reapplied straight
to source at some point since, so keeping them around as uncommitted
"pending" files was actively misleading about repo state. Nothing was
reverted or reapplied; this was a no-op on the actual code, confirmed via
`tsc -b --noEmit` passing clean before and after.

## Tier 4 — Timetable (feature 1 of 4)

`src/pages/Timetable.tsx` (new): weekly Mon–Sun grid of an academic-mode
course's `schedule` rows, hour gridlines sized to whatever range the actual
classes span (default 8:00–18:00 floor when there are none yet), each course
colored by cycling the four existing accent tones so it matches the palette
used everywhere else rather than inventing a new one. Overlapping classes on
the same day are clustered and laned (interval-overlap grouping, not a flat
"most lanes that ever occur that day" split) so two classes that don't
actually conflict each keep full width.

This is also the first UI that can *create* schedule rows — until now
`AcademicHome` could only read `schedule`/`assessments` data that had no way
to exist. Clicking a day column or an existing block opens a modal
(course/day/start/end/location) wired to the store's existing
`addSchedule`/`updateSchedule`/`deleteSchedule`.

Wiring: new `/timetable` route; Sidebar's Learning section swaps its
Courses-mode "Paths" link for "Timetable" when in Academic mode (a
sequential roadmap graph has no meaning for concurrent courses) via
`buildNavSections(mode)` replacing the old static `NAV_SECTIONS` array — the
other three sections are identical between modes, so only that one item is
conditional. `AcademicHome`'s "Today's Classes" card header now links to
`/timetable`.

Not done here (later Tier 4 items): the exam/assignment tracker, the
grade/GPA page, and the Courses-mode multi-roadmap switcher.

## Tier 4 — Deadlines (feature 2 of 4)

`src/pages/Deadlines.tsx` (new): a due-date list of `assessments` for active
academic courses, grouped into Overdue / Due This Week / Later (rose /
amber / neutral styling respectively), with a type filter (All / Exam /
Quiz / Assignment). Reuses the same course-tone-cycling as Timetable so a
course's color key stays consistent across both pages. Each row shows a
"Graded" pill when a `grades` row already exists for that assessment — read
directly from `useRoadmapStore(s => s.grades)`, no new getter needed for
that — but this page does **not** let you enter a score; that's deliberately
left for the grade/GPA page (next), so scoring lives in exactly one place.

CRUD is a click-to-edit `Modal` (course/title/type/due-date/weight%),
wired to the existing `addAssessment`/`updateAssessment`/`deleteAssessment`.
Course is locked on edit (an assessment doesn't reasonably move between
courses; delete-and-recreate is the honest way to fix a wrong pick, same
convention Courses.tsx already uses elsewhere for course-scoped children).

Wiring: new `/deadlines` route; Sidebar gets a "Deadlines" item in the
Learning section, shown only in Academic mode (inserted between "Courses"
and "Notes", right after where Timetable already replaces "Paths").
`AcademicHome`'s "Upcoming Deadlines" card now links through to it, same
pattern as the Timetable link added on "Today's Classes".

Not done here (remaining Tier 4 items): the grade/GPA page, and the
Courses-mode multi-roadmap switcher.

## Tier 4 — Grades (feature 3 of 4)

`src/pages/Grades.tsx` (new): the store already had everything computed
(`getCourseGrade`, `getGPA`, `setGrade`/`deleteGrade` were all delivered with
the Tier 0 store work) — this was purely the missing UI to read and write
that state. A GPA strip up top (same KPI-card shape as `AcademicHome`'s),
then one card per active academic course showing its weighted percentage +
letter + grade point and a list of that course's assessments; clicking an
assessment opens a score/out-of modal wired straight to `setGrade` (and
`deleteGrade` when clearing a recorded score). Deliberately does not let you
create or edit assessments here — that stays on Deadlines, so an
assessment's identity has exactly one owner and Grades only ever scores what
already exists; an empty-course state points there via a "Manage
Assessments" button.

Wiring: new `/grades` route; Sidebar gets a "Grades" item in the Learning
section (Academic mode only, right after Deadlines). `AcademicHome`'s
"Course Grades" card — previously inert, read-only — now links through to it
both via a header button and by making each course row clickable, same
pattern as the other two Academic Home cards.

Not done here (remaining Tier 4 item): the Courses-mode multi-roadmap
switcher.

## Tier 5 — Focus mode (item 1 of 3)

**Task**: "merge Pomodoro timer + Today's Focus card, mode-aware."

**What changed**: `src/components/focus/FocusWidget.tsx` (new) embeds the live
timer — ring, Start/Pause/Reset/Done — directly into the Home card that used
to just be static text plus a "Start Timer" button linking out to
`/tracker`. `CoursesHome`'s "Today's Learning Focus" card now renders it
against the active in-progress roadmap topic (`topicId`); `AcademicHome`
gets a new "Focus Mode" card the master plan didn't have before, targeting
today's next class, falling back to the nearest deadline, falling back to
an untargeted "General Study Session" when neither exists — that's the
mode-aware half of the task, since a topic-based subject has no meaning in
Academic mode. `/tracker` still exists unchanged for history, manual entry,
break timers, and the 7-day chart; the widget links out to it via a "Full
Tracker" affordance rather than duplicating that surface.

**Bug this surfaced and fixed**: `sessionStore`'s ticking `setInterval` used
to live inside `Tracker.tsx`'s `useEffect`, so a running timer silently
stopped counting down the moment you navigated away from that one page —
Home's new widget would have shown stale, frozen seconds. Moved the interval
to `AppLayout.tsx` (mounted for the whole authenticated session) and removed
the now-duplicate one from `Tracker.tsx`. `timerRunning`/`timerSeconds`
themselves were always global Zustand state; only the thing driving the
countdown was page-scoped, which is now fixed as a side effect of this task
rather than a separate bug ticket.

**`ownsTimer` guard**: if a session is already running against a different
course/topic than the one a given widget represents, that widget shows "A
different session is running" and disables Start (to avoid silently
clobbering the running session's start time) and Reset/Done (nothing of
this widget's to reset/complete) — but still shows the global Start/Pause
affordance correctly once state matches. This only matters when two
Home-style widgets could theoretically both be visible against different
subjects; today that's Courses-mode vs Academic-mode Home, which are never
rendered at once, so in practice it's dormant defensive code for whenever a
second concurrent widget (e.g. per-course Focus buttons on `Courses.tsx`)
gets added.

**Not done here** (remaining Tier 5 items): weekly review / spaced
repetition, D3 force-graph scaling for larger/multiple roadmaps.

## Tier 2 — store boundaries

**Question**: does the roadmap/course store hold courses from both modes
and let callers filter/query by mode without duplicating logic?

**Answer**: yes, as of the Tier 0 store changes — `courses` is one flat
array carrying `mode` on each row; `getCoursesByMode(mode)` and
`getActiveCourses(mode?)` are the two query points every mode-aware screen
should call rather than filtering `courses` inline themselves. No separate
store, slice, or duplicated CRUD path was introduced for Academic mode —
`addCourse`, `deleteCourse`, `updateTopicStatus` etc. are unchanged and used
by both modes. No further store-boundary work identified for Tier 2 beyond
what Tier 0 already did.
