# Projected Completion: what drives it, and what was wrong with it

## The short answer to your question

"Projected Completion" projects the **curriculum**, not the portfolio. It
counts **roadmap topics marked complete** (Courses → roadmap → set a topic to
Completed) and divides the topics you have left by that pace.

Adding projects and dragging their completion sliders doesn't feed it — a
project and a roadmap topic are different objects, and the projection has
only ever read topics. So the card was telling the truth, just not a useful
truth, and the caption underneath it ("Log sessions to calculate") was
pointing you at a third thing that also doesn't feed it. That copy was wrong
in the build you're running.

## What I changed

**1. The caption is now accurate and states the actual next step.**
It reads "Mark a roadmap topic complete to calculate" instead of "Log sessions
to calculate."

**2. "Calculating..." no longer means four different things.**
It used to be the fallback for every case where pace was zero. Now the card
distinguishes them:

| Situation | Card reads | Caption |
|---|---|---|
| No roadmap loaded | No roadmap yet | Load a roadmap to project a finish date |
| Roadmap loaded, nothing ever completed | Calculating... | Mark a roadmap topic complete to calculate |
| Topics completed, but none in 4 weeks | Paused | No topics completed in the last 4 weeks |
| Active | *e.g.* March 2027 | ~34 weeks at 2.1 topics/wk |
| Everything done | Complete | Every roadmap topic is done |

**3. The pace math no longer punishes you for being new.**
It divided the last four weeks' completions by a flat `4`, so if you started
three days ago and finished two topics, your pace read 0.5 topics/week and
the projected date landed years out. The window is now however much history
actually exists, capped at four weeks and floored at one — so two topics in
your first few days reads as 2.0 topics/wk, and the estimate tightens as real
history accumulates.

**4. Projects now appear on Analytics at all.**
A Portfolio Progress bar sits under the KPI strip: average completion, in
flight, finished, clickable through to /projects. I deliberately did **not**
fold project percentages into "Curriculum Covered" or the projected date —
mixing "40% through a dashboard build" into "how much of the roadmap is
learned" would produce a number that means nothing. They're two tracks, shown
side by side.

## What will make the date appear for you

Open Courses → roadmap, mark a topic Completed. One is enough for the card to
show a date; the estimate gets more honest with a few weeks of real history.
Topics you completed before the `completedAt` timestamp existed still don't
count — that timestamp was never recorded for them, and backfilling it to
today would fabricate a spike.

## Caveat

Same as before: `tsc -b` is clean, but `vite build` can't run in this sandbox
(pre-existing `rolldown` native-binding issue, unrelated). Run `npm run build`
locally.

Also included: the Projects/Notes/Home files from the previous message, since
it looks like that update hadn't been applied to your working copy yet.
