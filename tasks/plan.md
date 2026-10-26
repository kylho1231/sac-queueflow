# Implementation Plan: SAC QueueFlow UI/UX Pro Max Enhancement

## Overview
Elevate the SAC QueueFlow user interface to institutional SaaS excellence adhering strictly to the `ui-ux-pro-max` design intelligence standard (WCAG AA accessibility, visible focus rings, atomic live aria badges, interactive feedback, and high visual polish).

## Architecture & Design Decisions
- **Color Palette & Contrast**: Enforce St. Anthony's College education teal (`#0D9488`), dark emerald teal (`#093533`), golden course amber (`#F59E0B`), and clear text contrast (minimum 4.5:1 ratio).
- **Interactive Feedback**: Every button, input, and modal trigger must have explicit hover states (150–250ms), active tap scale (`active:scale-[0.98]`), `cursor-pointer`, and visible focus rings (`focus-visible:ring-2 focus-visible:ring-teal-600`).
- **Live Queue Accessibility**: Implement `<span role="status" aria-atomic="true">` for real-time queue status changes so screen readers understand when numbers advance without disruptive re-focusing.
- **Microinteractions**: Toast feedback for ticket generation, deferment activation, and counter dispatch events.

## Task List

### Phase 1: Interactive Feedback & Visual Polish (Student Workspace)
- [ ] Task 1.1: Add animated queue progress bar (visualizing students ahead vs serving)
- [ ] Task 1.2: Upgrade Join Queue modal with clear step validation and keyboard focus trap
- [ ] Task 1.3: Add instant toast notification alerts for actions (Ticket Issued, Deferment Started, Turn Approaching)

### Checkpoint: Phase 1 Complete
- [ ] Student flow tested with toast feedback and progress indicators
- [ ] Zero layout shifts on small viewports (375px)

### Phase 2: Operations Console & Dispatcher Polish (Staff Workspace)
- [ ] Task 2.1: Enhance Counter Dispatcher with animated transition when tickets advance
- [ ] Task 2.2: Add confirmation dialogs with distinct destructive color tokens for Skip / Mark No-Show
- [ ] Task 2.3: Visual timer indicating active service duration with green/amber/red pacing alerts

### Checkpoint: Phase 2 Complete
- [ ] Staff dispatcher transitions tested
- [ ] Service duration indicators verify correctly

### Phase 3: Accessibility & Verification
- [ ] Task 3.1: Add `role="status"` and `aria-atomic="true"` to live badge numbers
- [ ] Task 3.2: Verify keyboard navigation across modals and controls
- [ ] Task 3.3: Production build and Vercel redeployment

## Risks & Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| CSS bundle bloat from animation classes | Low | Leverage native Tailwind CSS transitions and minimal stateful timers |
| Screen reader spam during rapid ticket calls | Medium | Use atomic politeness (`aria-live="polite"` on badge container) |
