# Role Flow — App Context

## Purpose
Role Flow is a personal life-balance and time-tracking prototype. Users define the roles they occupy in life (e.g. Parent, Professional, Athlete), log activities against those roles, and visualise how their time distributes across them. The goal is intentional living — seeing whether actual time allocation matches what feels meaningful, and nudging reflection on that. No backend, no auth, fully local.

**Status:** Early prototype. Design phase not yet started. No production build needed.

---

## Tech Stack
- React 18 + TypeScript
- Vite (dev server only — no production build)
- TailwindCSS with custom `warm` colour palette and role-specific colour classes
- Framer Motion (animations, drag interactions, AnimatePresence)
- lucide-react (icons)
- localStorage for all persistence (key: `role-flow-state`)

---

## File Structure

```
src/
  App.tsx                         # Root component, routing, QuickAddModal
  index.tsx                       # Entry point
  types/
    index.ts                      # All TypeScript types + PRESET_COLORS + COMMON_EMOJIS
  hooks/
    useAppState.ts                # Central state + all mutations
  pages/
    OnboardingPage.tsx            # 3-step onboarding flow
    DashboardPage.tsx             # Main "Flow" tab
    CalendarPage.tsx              # "Plan" tab — timeline view
    ReflectionPage.tsx            # "Reflect" tab — guided journaling
    ProfilePage.tsx               # "Settings" tab — roles, balance goals, templates, data
    RoleOverviewPage.tsx          # Full-screen role detail (outside tab nav)
    ActivityLogPage.tsx           # Full activity history (built but NOT wired into nav yet)
  components/
    Navigation.tsx                # Bottom tab bar (Flow / Plan / + / Reflect / Profile)
    QuickAddModal.tsx             # Slide-up activity logging sheet
    ActivityCard.tsx              # Individual activity entry card
    VennDiagram.tsx               # SVG donut chart visualisation
    RoleChip.tsx                  # Reusable role pill/tag
    FocusModeIndicator.tsx        # Banner showing active focus role
    RoleTransitionModal.tsx       # Modal shown when switching focus role
    RoleSetup.tsx                 # (Exists, usage unclear — possibly legacy)
  utils/
    roleUtils.ts                  # Pure utility functions
```

---

## Data Model (`src/types/index.ts`)

```ts
type RoleColor = 'coral' | 'sage' | 'sky' | 'lavender' | 'amber' | 'mint';
type RoleGravity = 1 | 2 | 3 | 4 | 5;  // unused in current UI

interface Role {
  id: string;
  name: string;
  emoji: string;
  color: RoleColor;
  createdAt: number;
  motivation?: string;       // "Why does this matter?"
  paused?: boolean;          // Hides from donut + QuickAdd
  aspirational?: boolean;    // Shows sparkle icon in chip
  gravity?: RoleGravity;     // Deferred concept, not surfaced in UI
}

interface Activity {
  id: string;
  name: string;
  roleIds: string[];         // An activity can serve multiple roles
  timestamp: number;         // ms since epoch
  duration: number;          // minutes
  note?: string;
}

interface ActivityTemplate {
  id: string;
  name: string;
  emoji: string;
  roleIds: string[];         // Pre-fills role selection in QuickAdd
  duration: number;          // minutes
}

interface Reflection {
  id: string;
  type: 'daily' | 'weekly' | 'quarterly';
  timestamp: number;         // Start of the period (normalised to midnight/week-start)
  answers: Record<string, string>;  // prompt text → answer
}

interface TransitionSettings {
  ritualType: 'reflection' | 'breathing' | 'quick';
  customPrompts: string[];
  suggestionsEnabled: boolean;
}

interface RoleBalanceGoal {
  roleId: string;
  targetPercent: number;
}

interface AppState {
  roles: Role[];
  activities: Activity[];
  onboardingComplete: boolean;
  activeRoleId?: string;
  activityTemplates: ActivityTemplate[];
  transitionSettings: TransitionSettings;
  roleBalanceGoals: RoleBalanceGoal[];
  reflections: Reflection[];
}
```

**Colour map** (`PRESET_COLORS`):
```ts
coral:    '#F4845F'
sage:     '#7CB69D'
sky:      '#6BB5E0'
lavender: '#9B8EC4'
amber:    '#E8B960'
mint:     '#6DC5B2'
```

TailwindCSS aliases also exist: `text-role-coral`, `bg-role-amber`, etc. (defined in tailwind config).

---

## State Management (`src/hooks/useAppState.ts`)

Single custom hook. Persists entire `AppState` to localStorage on every state change via `useEffect`. `selectedRoleIds` is transient (session-only, not persisted).

**Storage key:** `'role-flow-state'`

**Default state includes** 4 built-in activity templates: School Pickup (30m), Deep Work (120m), Gym Session (60m), Family Dinner (60m).

**Exposed API:**
| Method | Purpose |
|--------|---------|
| `addRole(role)` | Appends to roles array |
| `updateRole(id, partial)` | Merges partial updates into a role |
| `removeRole(id)` | Deletes role + strips it from all activities; removes activities with no remaining roles |
| `togglePauseRole(id)` | Flips `role.paused` |
| `addActivity(activity)` | Prepends (newest first) |
| `removeActivity(id)` | Deletes by id |
| `completeOnboarding()` | Sets `onboardingComplete: true` |
| `toggleRoleSelection(id)` | Multi-select for dashboard filter (not used in App.tsx directly) |
| `clearSelection()` | Clears multi-select |
| `setSelectedRoleIds(ids[])` | Direct set (used by dashboard via VennDiagram) |
| `setActiveRole(id\|null)` | Sets focus role, driving ambient tint |
| `setRoleBalanceGoals(goals[])` | Replaces all balance goals |
| `updateTransitionSettings(partial)` | Merges into transition settings |
| `addActivityTemplate(tpl)` | Appends template |
| `removeActivityTemplate(id)` | Removes template |
| `clearActivityHistory()` | Wipes activities array |
| `saveReflection(reflection)` | Upserts by type+timestamp match |
| `exportData()` | Downloads state as JSON |
| `resetOnboarding()` | Resets to defaultState + clears localStorage (available but not called on mount — manual dev use only) |

**To manually reset state in dev:** `localStorage.removeItem('role-flow-state')` in browser console, then refresh.

---

## App Routing (`src/App.tsx`)

No React Router. Conditional rendering with `useState`:

```
state.onboardingComplete === false
  → <OnboardingPage>

viewingRoleId !== null
  → <RoleOverviewPage>  (full-screen replace, no back stack — known issue)

else (tab-based):
  activeTab === 'dashboard' → <DashboardPage>
  activeTab === 'calendar'  → <CalendarPage>
  activeTab === 'reflect'   → <ReflectionPage>
  default                   → <ProfilePage>

Always rendered:
  <Navigation> (bottom bar)
  <QuickAddModal> (global, shared across all tabs)
```

**Ambient background tint:** When `activeRoleId` is set, `App.tsx` applies `color-mix(in srgb, ${roleColor} 10%, #FAFAF7)` to the root div background. A radial gradient glow is also rendered as a fixed overlay. Both transition over 0.8s.

**QuickAdd:** `isQuickAddOpen` + `quickAddInitialTime` state in `App.tsx`. Calendar passes a timestamp; all other open calls pass `undefined` (logs at current time). IMPORTANT: always call `setQuickAddInitialTime(undefined)` before opening from non-calendar contexts to avoid stale future timestamps.

**Paused roles** are filtered out before being passed to Dashboard, Calendar, and QuickAddModal (`activeRoles = roles.filter(r => !r.paused)`). ProfilePage and RoleOverviewPage receive the full `state.roles`.

---

## Pages

### OnboardingPage
**3 steps:**
1. **Welcome** — App name + value proposition. Single "Get started" button.
2. **Add your roles** — Role suggestion chips (10 presets with emoji/color/description). Tap to instant-add. Custom role inline form: emoji picker (tappable grid of COMMON_EMOJIS) + name field + auto-assigned color cycle. Can add unlimited roles. Continue button disabled until ≥1 role added.
3. **Your roles** — MiniDonut SVG preview showing the roles. Two CTAs: "Log your first moment" (calls `onCompleteAndLog` → opens QuickAdd) and "Explore the app first" (calls `onComplete`).

**Role suggestions used in step 2:**
Professional, Parent, Partner, Friend, Athlete, Creative, Learner, Caregiver, Leader, Community (each has preset emoji + color + desc).

### DashboardPage
**Props:** roles, activities, selectedRoleIds, activeRoleId, onSelectionChange, onDeleteActivity, onRoleTap, onSetActiveRole, onOpenQuickAdd

**Layout:** Time period selector (Day/Week/Quarter) in header → FocusModeIndicator → VennDiagram donut card → Activity list section

**Activity display logic:**
- No selection: most recent 10 activities in period (`periodActivities.slice(0, 10)`)
- 1 role selected: all activities tagged with that role in period
- 2+ roles selected: activities tagged with ALL selected roles (exact match)

**Empty states (three distinct):**
1. `activities.length === 0` (first run): Role colour dots + "Your flow starts here" copy + "Log what you're doing now" button
2. Period has no activities but global has some: Period empty message + "Log something now" text link
3. Role selection has no results: "No activities found for this selection" message

**Activity list:** AnimatePresence wraps list; each ActivityCard gets `index` prop for stagger delay (0.04s × index).

### CalendarPage
Timeline view of activities. Passes a timestamp to `onOpenAddWithTime` when user taps a time slot. Full details not reviewed in depth.

### ReflectionPage
**Cadences:** Daily, Weekly, Quarterly (tabs)
**Navigation:** Chevron arrows to move backward/forward through periods
**PROMPTS** hardcoded per cadence (3 prompts each)
**Modes:** `edit` (textarea per prompt) and `view` (renders saved answers)
Auto-loads existing reflection when period changes; switches to view mode if found.
`saveReflection` upserts by matching type + periodTimestamp.

### ProfilePage
**5 collapsible sections** (only one open at a time):
1. **Role Management** — List of all roles (active + paused). Each row has Pause/Resume and Delete buttons. "Add New Role" inline form: emoji picker + name + motivation + colour swatch picker.
2. **Role Balance Goals** — Sliders per active role (0-100%). Visual bar shows proportion. "Reset to Equal" button.
3. **Transition Rituals** — Ritual type selector (Reflection/Breathing/Quick), suggestions toggle, custom prompts management (add/remove text prompts used during focus switch).
4. **Activity Templates** — List of templates with delete. "Create Template" inline form: name + duration presets. Templates are stored in `state.activityTemplates`.
5. **Data & Privacy** — "Local Storage Only" info, Export JSON button, "Delete Activity History" danger button.

**Note:** Role editing (name/emoji/color) is NOT possible — only pause/delete. This is Priority 1 in the improvements backlog.

### RoleOverviewPage
**Accessed via:** Tapping a donut segment → `onRoleTap(roleId)` → `setViewingRoleId(id)` in App.tsx → full-screen replace (no tab nav, no back stack — known issue).

**Layout:** Hero image (picsum.photos seeded by role name) with role colour overlay + emoji + name + motivation. Stats row (total time, activity count). Full activity history list (all time, sorted newest first).

**Back:** Chevron button calls `onBack` → `setViewingRoleId(null)` → returns to tab view.

**Known issue:** Tapping donut segment replaces entire app view — no slide-up sheet, no preserved dashboard state. This is Priority 2 in the improvements backlog.

### ActivityLogPage
**Fully built but NOT wired into navigation.** Accessible only if explicitly rendered.

**Features:** Search bar (name + note), role filter chips (horizontal scroll), activities grouped by day (Today/Yesterday/date). Delete via ActivityCard.

**To wire:** Add "See all →" link at bottom of DashboardPage activity list, route to this page. This is Priority 3 in improvements backlog.

---

## Components

### VennDiagram
SVG donut chart. The name is legacy — it is not a Venn diagram.

**SVG constants:**
```ts
SIZE = 220, CX = CY = 110
OUTER_R = 84, INNER_R = 50
GAP = roles.length === 1 ? 0 : 0.045  // radians gap between segments
```

**Segment sizing:** Time-based (`getRoleTimeLogged`). Roles with 0 time get a 4% ghost slice to stay visible in the donut.

**Selection:** Clicking a segment calls `onSelectionChange` (toggle filter) AND `onRoleTap` (navigate to RoleOverviewPage). Selected segments pop outward via `Math.cos/sin(midAngle) * POP` translation on a `motion.g`.

**Hover preview:** Mouse movement over a segment accumulates distance. Every 32px of movement (`CYCLE_DIST`), the displayed activity cycles to the next one. Switching segments resets index to 0. A floating tooltip card shows activity name + duration. Tooltip flips left/right based on cursor position (55% threshold) to avoid overflow.

**Legend:** Below the SVG. Each role shown as a coloured dot + name. Shared activities section shows bridges between roles that share activities.

### QuickAddModal
Slide-up sheet from bottom (spring animation, y: 100% → 0).

**Props:** isOpen, onClose, roles, activityTemplates (optional), onAddActivity, initialTimestamp (optional)

**Features:**
- Template row (draggable horizontal scroll via Framer Motion drag): Shows when `activityTemplates.length > 0`. Tap to pre-fill form; tap again to deselect.
- Activity name (large text input, auto-focused)
- Duration picker: preset buttons (15/30/60/90/120m) + manual number input
- Role selector: RoleChip buttons with `showEmoji={false}` and `selected` state
- Optional note textarea
- Submit disabled until name + at least 1 role selected

**DraggableTemplateRow:** Separate function component inside the file. Uses two refs to measure container vs content width; calculates `dragLeft = min(0, containerWidth - contentWidth)`. Resize listener recalculates on window resize.

### ActivityCard
**Props:** activity, roles, onDelete (optional), index (optional, default 0)

Renders: activity name, relative timestamp + duration badge (top right), optional note, role chips. Trash icon always visible (not hover-only) — positioned absolute top-right.

Stagger animation: `delay: index * 0.04, duration: 0.28`.

`formatRelativeTime` clamps future timestamps to `Date.now()` before calculating.

### Navigation
Fixed bottom bar. 4 tabs (Flow/Plan/Reflect/Profile) + floating `+` button in centre.
Tabs: HomeIcon / CalendarIcon / BookOpenIcon / UserIcon.
Labels: Flow / Plan / Reflect / Profile.
`+` button calls `onOpenAdd` (not a tab — opens QuickAddModal directly).

### RoleChip
**Props:** role, onRemove (optional), onClick (optional), selected (optional), size ('sm'|'md'), showEmoji (optional, default true), className

Inline-flex pill with role colour at 15% opacity background, 25% opacity border. Selected state adds `ring-2 ring-offset-2 ring-warm-800`. Aspirational roles show `SparklesIcon`. Remove button (×) when `onRemove` provided.

### FocusModeIndicator
Shows active focus role banner. When no focus is set: first-run shows "Pick a focus to guide your log"; returning user shows "No focus set". When focused: shows role name + colour + switch/clear controls.

### RoleTransitionModal
Modal shown when switching active (focus) role. Triggered from FocusModeIndicator via `onSwitchRole`. Uses `transitionSettings.ritualType` to determine content. Not deeply reviewed.

---

## Utility Functions (`src/utils/roleUtils.ts`)

| Function | Purpose |
|----------|---------|
| `generateId()` | `Math.random().toString(36).substring(2, 9)` |
| `getRoleActivities(activities, roleId)` | Activities containing roleId |
| `getActivitiesByExactRoles(activities, roleIds[])` | Activities with exactly the given roleIds |
| `getOverlapActivities(activities, roleIds[])` | Same as above (potential duplicate) |
| `getActivitiesInPeriod(activities, 'day'\|'week'\|'quarter')` | Last 1/7/90 days |
| `getRoleActivityCounts(activities, roles)` | Record<roleId, count> |
| `getRoleTimeLogged(activities, roles)` | Record<roleId, totalMinutes> |
| `getSharedActivityCount(activities, roleId1, roleId2)` | Count of activities shared between two roles |
| `getSharedTimeLogged(activities, roleId1, roleId2)` | Minutes shared between two roles |
| `formatRelativeTime(timestamp)` | "Just now" / "2 hours ago" / "Mar 5" — clamps future timestamps |
| `formatDuration(minutes)` | "45m" / "1h" / "1h 30m" |
| `getVennPositions(roleCount, cx, cy, radius)` | Circle positions for old Venn layout (legacy, not used by donut) |
| `getActivityDotPosition(activity, roles, rolePositions)` | Dot position for old Venn (legacy) |

---

## Known Issues & Gaps

1. **No role editing** — Can only pause or delete. Fixing a typo requires deleting (which cascades to remove activities with no remaining roles). Priority 1.
2. **RoleOverviewPage replaces entire app** — No navigation stack, no back gesture preserving dashboard state. Tapping donut segment = full-screen replace. Priority 2.
3. **ActivityLogPage is orphaned** — Built and functional but never rendered. No "See all" link from dashboard. Priority 3.
4. **No reflection nudge** — Reflect tab has no badge/indicator when a weekly reflection is pending. Users forget it exists. Priority 4.
5. **Focus → log gap** — Setting a focus role has no feedback loop with activity logging (no nudge after time passes). Priority 5.
6. **Template roleIds are empty by default** — The 4 built-in templates have `roleIds: []`, so tapping them pre-fills name + duration but no roles. User must still select roles manually.
7. **`getOverlapActivities` and `getActivitiesByExactRoles` are functionally identical** — minor duplication in utils.
8. **`getVennPositions` and `getActivityDotPosition` are legacy** — from the old proportional block view, not used by the current donut chart.

---

## Session Changes (prior to this document)

The following were built/changed in the session before this document was created:

- **VennDiagram.tsx** — Complete rewrite from proportional blocks to SVG donut chart with hover-to-preview cycling
- **OnboardingPage.tsx** — Rewritten from 5 steps to 3; removed aspirational/gravity steps; added role suggestion chips, MiniDonut preview, dual CTAs on final step
- **DashboardPage.tsx** — Three distinct empty states; contextual donut caption; 10 activity limit; AnimatePresence list animation; `onOpenQuickAdd` prop
- **QuickAddModal.tsx** — Added template row (draggable horizontal scroll); `activeTemplateId` state; `showEmoji={false}` on role chips
- **ActivityCard.tsx** — Stagger animation via index; trash icon always visible
- **RoleChip.tsx** — Added `showEmoji` prop
- **FocusModeIndicator.tsx** — Added `isFirstRun` prop; different copy for first-run vs returning
- **App.tsx** — Removed forced onboarding reset on mount; `onCompleteAndLog` prop; `onOpenQuickAdd` prop; passes `activityTemplates` to QuickAddModal
- **roleUtils.ts** — `formatRelativeTime` now clamps future timestamps
