# Task Breakdown: SAC QueueFlow UI/UX Pro Max Enhancement

## Task 1: Toast Notification System & Visual Queue Progress Bar
**Description:** Implement toast feedback component for instantaneous user action confirmation (Ticket Joined, Deferment Resumed, Copied Code) and add an intuitive visual progress bar on the active queue ticket showing where the student sits relative to the window.
**Acceptance criteria:**
- [ ] Lightweight toast overlay appears at top-right/bottom-center for 4 seconds upon key user actions
- [ ] Visual multi-segment progress bar indicates: (1) Waiting in Line, (2) Approaching Turn, (3) Called to Counter, (4) Service Underway
- [ ] Accessible `role="status"` announcements on progress advancement
**Verification:**
- [ ] Tests/Lint: `npm run lint` passes with 0 errors
- [ ] Build succeeds: `npm run build` succeeds
**Files touched:**
- `src/components/StudentDashboard.tsx`
- `src/context/QueueContext.tsx`

---

## Task 2: Staff Console Timer & Visual Service Pacing
**Description:** Upgrade the Staff Desk with a live service stopwatch timer for the currently active ticket, color-coded based on target duration (green under 3 mins, amber at 3–5 mins, red warning over 6 mins) and add confirmation feedback for skipping or marking absent students.
**Acceptance criteria:**
- [ ] Service duration stopwatch runs live when status is `SERVING`
- [ ] Clear destructive confirmation modal before finalizing `No-Show` or `Skip`
- [ ] Sound/visual indicator when a counter calls the next student
**Verification:**
- [ ] Lint passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
**Files touched:**
- `src/components/StaffDashboard.tsx`

---

## Task 3: Accessibility Focus Rings & Full Mobile Polish
**Description:** Review all interactive elements, modal backdrops, and form inputs for visible focus rings (`focus-visible:ring-2 focus-visible:ring-teal-600`), mobile tap target padding (≥44px), and seamless responsive layout at 375px/768px/1024px.
**Acceptance criteria:**
- [ ] All buttons, select menus, and close buttons have visible keyboard focus rings
- [ ] Modals can be dismissed with `Escape` key
- [ ] No horizontal overflow on 375px mobile screens
**Verification:**
- [ ] Production build succeeds
- [ ] Deployed live to Vercel
**Files touched:**
- `src/components/NavigationHeader.tsx`
- `src/components/StudentDashboard.tsx`
- `src/components/StaffDashboard.tsx`
- `src/components/TVQueueDisplay.tsx`
