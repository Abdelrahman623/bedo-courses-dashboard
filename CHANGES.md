# Mobile / tablet navigation fix

**Problem:** the sidebar was a fixed-width flex child (220px / 64px) with no
responsive behavior at all, and the top bar had no way to open or close it.
On phone and tablet widths it just squeezed the page content into a sliver
next to a nav rail that was never meant to be there.

**Fix:** below the `lg` breakpoint (1024px) the sidebar now behaves as an
off‑canvas drawer instead of a permanent column:

- Hidden off-screen by default (`-translate-x-full`), slides in over the
  content when opened (`translate-x-0`), with a dark backdrop behind it.
- A hamburger button in the top bar (visible only below `lg`) opens it;
  tapping the backdrop, the new ✕ button in the drawer header, or any nav
  link closes it again.
- At `lg` and above, nothing changed — same static column, same
  collapse/expand toggle, same behavior as before.

The top bar itself also got tightened up for small screens: less horizontal
padding, the title truncates instead of wrapping/overflowing, the date is
hidden below `sm` to make room, and the notifications panel now clamps its
width so it can't run off the edge of a narrow phone screen.

## Files

- `src/store/uiStore.ts` — **new**. Tiny zustand store (matches the pattern
  of your other stores) holding `mobileSidebarOpen`, shared between
  `TopBar` (the hamburger) and `Sidebar` (the drawer + backdrop).
- `src/components/layout/Sidebar.tsx` — modified. Off-canvas drawer below
  `lg`, unchanged static rail at `lg+`.
- `src/components/layout/TopBar.tsx` — modified. Hamburger button,
  responsive padding/title, notification panel width clamp.

## How to apply

Drop these three files into your project at the same paths (overwriting the
two existing ones), or apply `changes.patch` with:

```
git apply changes.patch
```
(`uiStore.ts` is new, so it isn't in the patch — just copy it in.)

`npx tsc -b` passes clean with these changes. I couldn't run a full
`vite build` in this sandbox (a pre-existing, unrelated native-binding issue
with `rolldown`'s optional deps — nothing to do with this fix), so give
`npm run build` a run locally before shipping.

## Next up

You said the priority was the shell first. Once you've checked this out,
the individual pages (Courses, Notes, Settings, etc.) likely have their own
overflow issues at phone/tablet widths — happy to go through those next.
