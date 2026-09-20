# Tracker & Analytics: streak, chart and goal fixes

Three separate bugs, all in the "numbers don't add up / pages don't agree
with each other" family:

## 1. Current Streak was capped and wrong

`sessionStore.computeStreaks()` walked backward day-by-day to find both the
current and longest streak, but only ever *wrote* `currentStreak` while
`i <= 1` (today/yesterday). Past that, the walk kept counting internally but
stopped updating the number you actually see. Net effect: any streak longer
than 2 days reported as roughly "2" everywhere it's shown — Tracker, the top
bar notification, and Analytics' "Active Cadence" all pull from this same
store value, so it was consistently wrong, and specifically wrong in a way
that made `currentStreak` look disconnected from `longestStreak` (e.g. a
6-day active streak showing "Current: 2 / Record: 6" when it should read
"Current: 6 / Record: 6").

**Fix:** rewrote the walk so `current` is the actual unbroken run counting
back from today (today not being logged yet doesn't break it — the day
isn't over — so it falls back to yesterday). `longest` logic was already
correct and is untouched.

## 2. The Curriculum Velocity chart was permanently zero

Analytics' "Curriculum Velocity (Last 12 Weeks)" chart, the "Current pace"
figure next to it, and the "Projected Completion" KPI were all driven by
`activity[].topics_completed` — a field that `sessionStore.recalculateActivity`
hardcoded to `0` for every single day, because nothing in the app ever
recorded *when* a roadmap topic was marked complete. There was no bug to
"fix" in the chart itself; the number it was reading had no data behind it
at all, so it could only ever show a flat zero line, "0.0 topics/wk", and
"Log sessions to calculate."

The deeper issue is architectural: topic completion and study-session time
are different events, and the chart was (incorrectly) wired to session data
instead of roadmap data.

**Fix:**
- `RoadmapNode` gets a new optional `completedAt` timestamp.
- `roadmapStore.setLocalTopicStatus` stamps it the moment a topic's status
  *transitions* to `'completed'` (and clears it if the topic is reopened).
  This lives in the same JSON canvas blob (`roadmap_canvas` in
  `user_state`) as the rest of a node's metadata already does — no database
  migration needed.
- Analytics now builds the velocity chart from `localNodes[].completedAt`
  directly, independent of session/time data.

**Known limitation, being upfront about it:** topics that were already
marked `completed` *before* this change has no way to know when that
happened — that timestamp was never captured. Those won't retroactively
appear in the velocity chart or count toward "current pace." I deliberately
didn't backfill them to "today," since that would just move the
fabrication from "always zero" to "a fake spike on whatever day you happen
to deploy this" — a different wrong number. Every completion from here
forward will be tracked correctly and the chart will fill in over the next
few weeks of real use.

## 3. Tracker's weekly goal ignored the account setting

`Tracker.tsx` had `const weekGoal = 10;` hardcoded, while Home, the top bar
notification, and Settings itself all correctly read the account's actual
`profile.weekly_goal_hours`. Set your goal to, say, 20h in Settings and
Home/the top bar update to match — Tracker kept showing progress against
10h regardless. Now it reads `profile?.weekly_goal_hours ?? 10`, same as
everywhere else.

## Files

- `src/store/sessionStore.ts` — streak calculation rewrite.
- `src/store/roadmapStore.ts` — stamps/clears `completedAt` on status change.
- `src/types/index.ts` — adds `completedAt?: string` to `RoadmapNode`.
- `src/pages/Analytics.tsx` — velocity chart now built from `completedAt`.
- `src/pages/Tracker.tsx` — weekly goal now reads the account setting.

## How to apply

Drop these five files into your project at matching paths, or:
```
git apply changes.patch
```

`npx tsc -b` passes clean with these changes.
