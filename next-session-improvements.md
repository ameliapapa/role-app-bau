# Next Session — Improvements Backlog

## Priority 1 — Role Editing (Blocking)
Users can pause or delete roles but cannot edit them. A typo in a role name or a wrong emoji requires deleting the role entirely, which cascades and removes all associated activity history.

**What to build:**
- Inline edit form in Profile > Role Management (name, emoji, color)
- Non-destructive — activity associations are preserved
- Same form pattern as role creation, triggered by an edit icon on each role row

---

## Priority 2 — Non-Destructive Role Navigation
Tapping a role segment on the donut replaces the entire app with `RoleOverviewPage`. There is no navigation stack, no back gesture, and the time period filter the user had selected is lost on return.

**What to build:**
- Slide-up sheet or modal overlay for role detail instead of full-screen replace
- Preserve dashboard state (time period, scroll position) on return
- Add primary actions inside the role detail: Log Activity (pre-filled to this role), Edit Role

---

## Priority 3 — Wire Activity Log Page
`ActivityLogPage.tsx` is fully built (search, role filter, grouped by day) but is never rendered anywhere in the app. The dashboard caps at 10 activities — users with more history have no way to access it.

**What to build:**
- "See all →" link at the bottom of the dashboard activity list
- Routes to the existing ActivityLogPage
- No new UI needed — just wire it in

---

## Priority 4 — Reflection Triggers
The Reflect tab is entirely passive. Nothing in the app nudges the user toward it. Most users will forget it exists after day two.

**What to build:**
- Badge on the Reflect nav icon when a weekly reflection is pending
- Simple logic: if no reflection saved this week, show the indicator
- Optional: a subtle prompt card on the dashboard ("How was your week?")

---

## Priority 5 — Focus → Log Nudge
Setting a focus role changes the ambient background tint but creates no feedback loop with activity logging.

**What to build:**
- After a configurable time focused on a role (e.g. 30–60 min), show a lightweight nudge: "You've been focused on Work for 45 min — log it?"
- Opens QuickAdd pre-filled with the focused role and suggested duration
- Dismissible, not intrusive

---

## Lower Priority / Post-MVP

- **Templates in Calendar** — quick chips above the day view for rapid logging
- **Energising activity toggle** — optional flag when logging, surfaced in role overview and donut insights
- **Balance Goals** — promote out of Profile settings into a more discoverable surface
- **Onboarding aspirational/gravity steps** — re-introduce after ~1 week of usage via a nudge card on the dashboard
