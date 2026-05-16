# ParentingPal Refactoring Plan

## Overview

Rebrand **FamilyHub** → **ParentingPal** (digital parenting companion app), add demo login bypass, and reframe all UI messaging around parenting/family management. All existing features (calendar, chores, meals, lists, photos) are preserved — only branding, labels, and auth flow change.

---

## 1. Branding Changes (Global Renames)

### 1.1 HTML Meta / PWA (`index.html`)
| Current | Target |
|---------|--------|
| `<title>FamilyHub - Family Calendar & Organizer</title>` | `<title>ParentingPal - Your Digital Parenting Companion</title>` |
| `meta name="description" content="Family calendar and organizer"` | `content="Your all-in-one parenting companion — schedules, tasks, meals & more"` |
| `meta name="apple-mobile-web-app-title" content="FamilyHub"` | `content="ParentingPal"` |
| `meta name="theme-color" content="#faf8f5"` | Keep (warm cream fits parenting brand) |

### 1.2 App Header (`src/components/shared/app-header.tsx`)
| Line | Current | Target |
|------|---------|--------|
| ~59 | `{familyName || "Family Hub"}` | `{familyName || "ParentingPal"}` |

### 1.3 Sidebar Menu (`src/components/shared/sidebar-menu.tsx`)
| Line | Current | Target |
|------|---------|--------|
| ~64 | `{familyName || "Family Hub"}` | `{familyName || "ParentingPal"}` |
| ~66 | `Calendar Settings` | `App Settings` |
| ~76 | `Family Members` | `Children & Family` |

### 1.4 Onboarding Welcome (`src/components/onboarding/onboarding-welcome.tsx`)
| Line | Current | Target |
|------|---------|--------|
| ~22 | `Welcome to FamilyHub` | `Welcome to ParentingPal` |
| ~24-26 | `Your family's central place for schedules, chores, and staying connected.` | `Your all-in-one companion for managing the family's schedule, tasks, meals, and daily life.` |
| ~37 | `Shared Calendar` | `Shared Family Calendar` |
| ~49 | `Family Profiles` | `Children's Profiles` |
| ~50-51 | `Color-coded events for each member` | `Track each child's activities with color-coded events` |

### 1.5 Login Form (`src/components/auth/login-form.tsx`)
| Line | Current | Target |
|------|---------|--------|
| ~49-50 | `Welcome Back!` / `Sign in to your family calendar` | `Welcome Back!` / `Sign in to your parenting dashboard` |
| ~102 | `New to Family Hub?` | `New to ParentingPal?` |
| ~108 | `Create an account` | `Create an account` (keep) |

---

## 2. Demo Login Bypass

### 2.1 Auth Store Enhancement (`src/stores/auth-store.ts`)
Add demo mode state:

```typescript
interface AuthHydrationState {
  _hasHydrated: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean; // NEW
  setHasHydrated: (state: boolean) => void;
  setAuthenticated: (state: boolean) => void;
  setDemoMode: (state: boolean) => void; // NEW
}
```

### 2.2 Demo Data Seeding (`src/lib/demo-data.ts`) — NEW FILE
Create a seeded demo family with realistic data:

**Demo Family: "The Thompsons"**
- Alice Thompson (Mom) — coral color
- Bob Thompson (Dad) — teal color
- Emma (8 years old) — green color
- Jack (5 years old) — purple color

**Seeded demo data:**
- 5-6 calendar events across the current week
- 3-4 chores assigned to kids
- 1 meal plan (this week)
- 1-2 shopping lists with items

### 2.3 Login Flow Changes (`src/components/auth/login-form.tsx`)
Add prominent "Try Demo" button above the form:

```tsx
// New button section above the form
<div className="space-y-4">
  <Button 
    variant="outline" 
    size="lg" 
    className="w-full" 
    onClick={handleDemoLogin}
  >
    Try Demo — See it in action
  </Button>
  
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <span className="w-full border-t border-border" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
      <span className="bg-background px-2 text-muted-foreground">or</span>
    </div>
  </div>
</div>
```

### 2.4 Demo Handler Logic
When demo mode is active:
1. Skip actual API login call
2. Seed `localStorage` with demo family data and auth token
3. Set `isAuthenticated: true` and `isDemoMode: true`
4. On logout, clear demo state and redirect to login

### 2.5 App.tsx Changes
When `isDemoMode` is true:
- Show a subtle "Demo Mode" indicator in the header
- Keep all features functional but with seeded data

---

## 3. UI Messaging Refranes

### 3.1 Home Dashboard Header
Currently uses `familyName` — keep dynamic but update default/fallback text from "Family Hub" to "ParentingPal" in `app-header.tsx`.

### 3.2 Navigation Tabs
Keep labels as-is (Calendar, Lists, Chores, Meals, Photos) — these are generic and parenting-appropriate.

### 3.3 Mobile Bottom Nav
Keep labels as-is — same as above.

### 3.4 Onboarding Family Name Step
Update step title from "Your Family Name" → "Your Family Name" (keep, it's fine), but update helper text to "This is the name of your family that will appear in the app."

### 3.5 Onboarding Members Step
- Section title: "Who's in your family?" → "Who's in your family?" (keep)
- But frame member cards around "children" and "parents" context
- Add age field optionally (part of this refactor)

### 3.6 Chores View
Consider relabeling "Chores" → "Kids' Tasks" or keep "Chores" as-is (clear enough). **Decision: Keep "Chores"** — it's well-understood.

### 3.7 Meals View
Consider relabeling "Meals" → "Meal Planning" in nav tabs. **Decision: Keep "Meals"** in nav but add subtitle "Plan family meals" in the view header.

---

## 4. Color & Theme (Minimal Changes)

The existing warm cream/peach color scheme (`oklch(0.98 0.01 85)` background) already feels family-friendly and parenting-appropriate. No major color overhaul needed.

**Optional refinement:**
- Primary color `--primary: oklch(0.55 0.18 285)` (purple) feels friendly and warm — keep it
- Could add a subtle "parenting" accent in the onboarding gradient if desired

**Member colors (7 total):** Keep exactly as-is — the `colorMap` in `src/lib/types/family.ts` has 7 colors that are already used for family members. These work fine for "children" in a parenting context.

---

## 5. Demo Mode Indicator

Add a subtle banner or badge indicating demo mode is active. In `app-header.tsx`:

```tsx
{isDemoMode && (
  <div className="absolute top-0 left-0 right-0 bg-primary/10 text-xs text-primary px-2 py-1 text-center">
    Demo Mode — This is a sample family
  </div>
)}
```

Or use a non-intrusive pill badge next to the family name.

---

## 6. File Inventory (Changes Required)

| File | Change Type |
|------|-------------|
| `index.html` | Rewrite meta/title/PWA tags |
| `src/index.css` | No changes (colors already fine) |
| `src/stores/auth-store.ts` | Add `isDemoMode` state + setter |
| `src/lib/demo-data.ts` | **NEW** — demo family + seed data |
| `src/components/auth/login-form.tsx` | Add "Try Demo" button + handler |
| `src/components/auth/login-flow.tsx` | Pass demo mode down if needed |
| `src/components/onboarding/onboarding-welcome.tsx` | Text changes |
| `src/components/shared/app-header.tsx` | Fallback text change + demo indicator |
| `src/components/shared/sidebar-menu.tsx` | Label changes |
| `src/App.tsx` | Read `isDemoMode` from store, add demo indicator |

**No changes needed for:**
- All calendar views and components
- All chores components
- All meals components
- All lists components
- All photos components
- Type definitions
- API services and hooks
- Test files (can be updated separately if needed)

---

## 7. Implementation Order

### Phase 1: Core Rebranding (Low Risk)
1. Update `index.html` — title, meta, PWA
2. Update `app-header.tsx` — fallback text
3. Update `sidebar-menu.tsx` — labels
4. Update `onboarding-welcome.tsx` — text changes

### Phase 2: Demo Mode (Medium Risk)
5. Create `src/lib/demo-data.ts` — demo family + sample data
6. Update `src/stores/auth-store.ts` — add `isDemoMode`
7. Update `src/components/auth/login-form.tsx` — add Try Demo button
8. Update `src/App.tsx` — demo mode indicator

### Phase 3: Polish
9. Update `login-form.tsx` — subtitle text update
10. Add demo indicator in app header
11. Test full demo flow end-to-end

---

## 8. Verification Plan

After refactoring:
1. Run `npm run dev` — app loads without errors
2. Click "Try Demo" — immediately see seeded family dashboard
3. Navigate all modules: Calendar, Lists, Chores, Meals, Photos — all functional
4. Check onboarding flow — text updated appropriately
5. Run `npm run build` — no TypeScript errors
6. Run `npm test` — existing tests still pass (or mark哪些需要 updates)

---

## 9. Notes & Constraints

- **No backend changes** — all demo data lives in localStorage / mock API
- **No feature changes** — only rebranding and auth bypass
- **Demo mode is single-session** — logout clears all demo data
- **Family data structure preserved** — no changes to `FamilyData` or `FamilyMember` types
- **Member colors unchanged** — keep existing 7-color palette
- **Onboarding still functional** — new users can still register a real family

---

## 10. Future Considerations (Out of Scope)

- Backend integration for real auth
- Multi-family support
- Sharing with extended family (grandparents, nannies)
- Push notifications
- Offline PWA support (already noted in README as "coming soon")

---

## Appendix A: Full App Breakdown — UI & Features

### App Entry & Auth Flow

**Unauthenticated state** (`App.tsx` lines 122-141):
- If not authenticated, renders `LoginFlow` or `OnboardingFlow` based on `showOnboarding` state
- `LoginFlow` → `LoginForm` with username/password fields
- `OnboardingFlow` → 3-step wizard: Welcome → Family Name → Members → Credentials

**Loading state**: Full-screen pulsing "Loading..." while stores hydrate from localStorage

**Authenticated state** (lines 156-173):
- `AppHeader` (desktop/mobile)
- `NavigationTabs` (desktop sidebar) or `MobileBottomNav` (mobile)
- Main content area (module render)
- `SidebarMenu` (slide-in drawer)
- `Toaster` notifications

---

### 1. Login / Onboarding Flow

#### Login Screen (`src/components/auth/login-form.tsx`)
- Centered card layout, full-height
- Heading: "Welcome Back!" with subtext "Sign in to your family calendar"
- Username input (autofocused), password input
- Submit button "Sign In", loading state "Signing in..."
- Error banner for invalid credentials (401)
- Footer link: "New to Family Hub? Create an account" → triggers onboarding

#### Onboarding Welcome (`src/components/onboarding/onboarding-welcome.tsx`)
- Full-screen gradient background (`from-primary/10 to-background`)
- Large centered heart icon in primary-colored circle
- Heading: "Welcome to FamilyHub"
- Subtext: "Your family's central place for schedules, chores, and staying connected."
- Three feature cards:
  - Shared Calendar (Calendar icon, "See everyone's schedule at a glance")
  - Family Profiles (Users icon, "Color-coded events for each member")
  - One more card
- CTA: "Get Started" button → family name step

#### Onboarding Family Name (`src/components/onboarding/onboarding-family-name.tsx`)
- Back arrow + "Step 1 of 3"
- Heading: "What should we call your family?"
- Single text input for family name
- Next button (disabled if empty)

#### Onboarding Members (`src/components/onboarding/onboarding-members.tsx`)
- Back arrow + "Step 2 of 3"
- Heading: "Who's in your family?" / Subtext: "Add each family member with their own color."
- List of added `MemberCard` components (initially empty)
- "Add Family Member" dashed-border button (disabled when 7 members reached)
- `MemberFormModal` for add/edit with name field + 7-color picker
- Continue button (disabled until ≥1 member added)

#### Member Card (`src/components/onboarding/member-card.tsx`)
- Circle avatar with initial, colored background
- Name text
- Pencil edit button, Trash remove button (disabled if only 1 member remains)

#### Onboarding Credentials (`src/components/onboarding/onboarding-credentials.tsx`)
- Back arrow + "Step 3 of 3"
- Heading: "Create Your Login"
- Subtext: "Your family will use these credentials to sign in on any device."
- Username field with real-time availability check (debounced 500ms)
  - Green checkmark when available, red X when taken
- Password field
- Confirm password field
- Submit button: "Complete Setup" / "Creating Account..."
- Error banner for registration failures (409 CONFLICT, NETWORK_ERROR, etc.)

---

### 2. Home Dashboard (`src/components/home/home-dashboard.tsx`)

**Mobile-only view** (desktop redirects to calendar on null module)

**Dashboard Header** (`src/components/home/components/dashboard-header.tsx`):
- Dynamic greeting: "Good morning/afternoon/evening, [familyName]"
- Date: "EEEE, MMM d" format

**Member Chip Row** (`src/components/home/components/member-chip-row.tsx`):
- Horizontal scrollable row of member filter chips
- Each chip: colored circle + member name
- Tap to filter; all-selected shows all events
- Used for quick filtering on home screen

**Hero Card** (`src/components/home/components/hero-card.tsx`):
- Large card showing most relevant upcoming event
- States derived from `deriveHeroState()`:
  - `RIGHT_NOW`: event currently happening, shows live pulsing dot
  - `UP_NEXT`: next event with relative countdown
  - `ALL_DAY_ONLY`: all-day event today
  - `REST_OF_DAY_CLEAR`: no more events today
  - `ALL_CLEAR_TODAY`: no events at all
- Colored left border bar matching member color
- Tappable → opens event detail modal
- Non-event states show Sparkles icon

**Today List** (`src/components/home/components/today-list.tsx`):
- List of today's events (excluding hero event)
- Each row: member color dot, event title, time, location
- Tappable → event detail modal
- "Coming Up" section below

**Coming Up** (`src/components/home/components/coming-up.tsx`):
- Events for next 3 days after today
- Grouped by day with sticky date headers
- Same row format as Today List

**Add Event FAB**: Fixed bottom-right circular button with Plus icon

---

### 3. Calendar Module (`src/components/calendar/calendar-module.tsx`)

#### Desktop Toolbar (above calendar grid):
- `CalendarViewSwitcher`: 4 buttons (Daily/Weekly/Monthly/Schedule)
- `FamilyFilterPills`: horizontal row of member avatars, tap to toggle filter

#### Mobile Toolbar (`src/components/calendar/components/mobile-toolbar.tsx`):
- Row 1: Context-aware date label (e.g., "May 2026" or "Sat, May 10") + "Today" button + hamburger menu
- Row 2: View switcher pills (D/W/M/S) + member avatar filter dots

#### Four Desktop Views:

**Daily Calendar** (`src/components/calendar/views/daily-calendar.tsx`):
- Left time column (6 AM–11 PM, 80px/hour rows)
- Single day column with hour grid lines
- Colored event blocks positioned absolutely by time
- Overlapping events get column layout (up to 3 columns)
- All-day events section above grid
- Current time indicator line (auto-scrolls to now on load)
- Member color dots in day header row
- Event click → detail modal

**Weekly Calendar** (`src/components/calendar/views/weekly-calendar.tsx`):
- 7-column grid with day headers (Sun–Sat)
- Day headers show date number, "TODAY" badge, member color dots
- Current day column highlighted with `bg-primary/10`
- All-day events row per day
- 6 AM–11 PM time grid
- Events as colored blocks (max 3 columns on desktop)
- Current time indicator
- Horizontal scroll container (min-width 640px)

**Monthly Calendar** (`src/components/calendar/views/monthly-calendar.tsx`):
- 7-column grid, day cells with date numbers
- Up to 3 event dots per day (color-coded), "+N more" overflow
- Tappable day cells → switch to daily view
- Current day highlighted

**Schedule Calendar** (`src/components/calendar/views/schedule-calendar.tsx`):
- Vertical scrolling list view (14 days)
- Sticky date headers: "Today — Sat, May 10" or "Tomorrow — Sun, May 11" or "Sunday, May 11"
- Today's header highlighted in primary color
- Event cards with left border color, title, time, location
- MemberAvatar on right side of card
- Empty state: calendar icon + "No upcoming events" message

#### Mobile Views (6 AM–10 PM grid):

**Mobile Daily View** (`src/components/calendar/views/mobile/mobile-daily-view.tsx`):
- Swipeable container (swipe left/right for prev/next day)
- 32px time column, event grid with 60px/hour rows
- Event blocks with left border in member color
- Even-hour labels only (6, 8, 10, 12, 2, 4, 6, 8, 10)
- Current time indicator
- Auto-scroll to current time on today's view

**Mobile Weekly View** (`src/components/calendar/views/mobile/mobile-weekly-view.tsx`):
- Swipeable date strip header (7 tabs)
- Tap day tab → switch to daily view
- Day labels: Sun/Mon/Tue... + date number + TODAY badge
- Colored event dots per day (max 3)
- Scrollable day-by-day event list below
- Each event row: color dot + title + time

**Mobile Monthly View** (`src/components/calendar/views/mobile/mobile-monthly-view.tsx`):
- Full month grid
- Day cells with date numbers
- Event dots (up to 3) with "+N" overflow
- Tap day → select date in store (stays in monthly view)
- Swipe left/right for prev/next month

#### Add Event FAB (`src/components/calendar/components/add-event-button.tsx`):
- Fixed position, bottom-right, 56px circle
- Plus icon in primary color
- Desktop: 2rem from bottom-right
- Mobile: accounts for safe-area-inset + bottom nav height

#### Event Form Modal (`src/components/calendar/components/event-form.tsx`):
- Full-screen on mobile, centered modal on desktop
- Fields:
  - Event Name (text input, required)
  - Date (DatePicker)
  - Recurrence picker (None/Daily/Weekly/Monthly + interval + end date)
  - All-day toggle switch
  - End Date (multi-day all-day events only)
  - Start Time / End Time (TimePicker grid, hidden if all-day)
  - Assign To (MemberSelector dropdown with avatar chips)
  - Description (collapsible textarea, 2000 char limit)
- Submit: "Add Event" / "Save Changes"
- Cancel button (optional)
- Smart defaults: today date, next 15-min time slot, first member

#### Event Detail Modal (`src/components/calendar/components/event-detail-modal.tsx`):
- Member avatar circle + name
- Date (formatted: single day or date range for multi-day)
- Time (or "All day" badge)
- Recurrence label (if recurring)
- Location (if set)
- Description (if set)
- Google Calendar link (if synced from Google)
- Edit / Delete buttons
- Delete confirmation inline ("Are you sure?" → Cancel / "Delete Event")

#### Edit Scope Dialog (`src/components/calendar/components/edit-scope-dialog.tsx`):
- Appears when editing/deleting a recurring event
- "Edit this event only" / "Edit all events in series"
- "Delete this event only" / "Delete all events in series"

#### Floating Action Layout constants:
- `MOBILE_FAB_BOTTOM_OFFSET`: max(5rem, env(safe-area-inset-bottom) + 1rem)
- `MOBILE_FAB_SCROLL_PADDING`: max(5rem, calc(env(safe-area-inset-bottom) + 5rem))

---

### 4. Chores Module (`src/components/chores-view.tsx`)

**Chore Lane per family member** (`src/components/chores/chore-lane.tsx`):
- Header: member avatar circle (colored) + name + progress bar
- Progress bar fills based on completed/total ratio
- List of `ChoreRow` components

**Chore Row** (`src/components/chores/chore-row.tsx`):
- Checkbox (tappable, animated)
- Chore title text
- Due date badge (overdue = red, today = yellow, future = gray)
- Trash icon button (delete)
- Completed chores shown with strikethrough text, muted colors

**Chore Form Sheet** (`src/components/chores/chore-form-sheet.tsx`):
- Bottom sheet (mobile) / dialog (desktop)
- Title input (required)
- Assigned To member selector
- Due Date picker (optional)
- Submit: "Add Chore"

**States**:
- Loading: centered "Loading chores..." text
- Error: red alert banner "Could not load chores. Try again in a moment."
- Empty: "No chores yet" illustration + "Add the first chore to start the family board."
- "All caught up": green info banner "Everything is done for now. Completed chores stay visible below."

**Urgency sorting**: overdue → today → future → no date; within same urgency, sorted by due date then creation date

---

### 5. Meals Module (`src/components/meals-view.tsx`)

**Header**:
- Heading: "Meal Planning" / Subtext: "Plan family meals"
- Week navigation (chevron left/right + "This Week" label)

**Day Selector Tabs**:
- Horizontal scrollable row of day buttons (7 days)
- Each tab: day name (Mon) + date number (13)
- Selected: primary background; Today: primary/10 tint
- Tap to select day

**Meal Cards for Selected Day**:
Three cards (Breakfast/Lunch/Dinner):
- Icon in colored circle (yellow for breakfast, orange for lunch, indigo for dinner)
- Meal type label + subtext ("Morning meal" etc.)
- Meal name text on tinted background (yellow-50, orange-50, indigo-50)
- "No meal planned" fallback text

**Sample Data Generation** (`src/lib/calendar-data.ts`):
- `generateSampleMeals()` returns 7 days of randomized meals
- Breakfast options: Pancakes, Oatmeal, Eggs & Toast, Smoothie Bowl, Cereal, Waffles, Yogurt Parfait
- Lunch options: Sandwiches, Salad, Soup, Leftovers, Pizza, Tacos, Pasta Salad
- Dinner options: Grilled Chicken, Pasta Night, Taco Tuesday, Fish & Veggies, Stir Fry, BBQ Ribs, Homemade Pizza

---

### 6. Lists Module (`src/components/lists-view.tsx`)

**Lists Overview**:
- Heading: "My Lists" + "New List" button
- Grid of `ListCard` components (2 columns on desktop, 1 on mobile)

**List Card** (`src/components/lists/list-card.tsx`):
- Icon in colored circle (ShoppingCart=emerald for grocery, ListTodo=sky for to-do, ClipboardList=amber for general)
- Category badge (Grocery / To-do / General)
- List name (line-clamp 2 lines)
- Progress label: "3 of 7 done"
- Remaining label: "4 items left"
- Min-height 128px, hover: border-primary/40 + shadow

**List Create Sheet** (`src/components/lists/list-create-sheet.tsx`):
- Bottom sheet
- List name input
- Kind selector: Grocery / To-do / General (radio or cards)
- Submit: "Create List"

**List Detail View** (`src/components/lists/list-detail-view.tsx`):
- Back button → returns to lists overview
- List header card:
  - Category label + list name
  - "Add item" button
  - Category display mode toggle (Show/Hide categories) — hidden for general lists
  - Completed items toggle (Family default / Always show / Hide)
  - "Show completed by default" checkbox (family-wide preference)
  - "Remove all completed" button (trash icon)
- Item sections (grouped by category or flat):
  - Category header (if grouped): category name, non-collapsible
  - `ListItemRow` per item

**List Item Row** (`src/components/lists/list-item-row.tsx`):
- Checkbox (tap to toggle)
- Item text (completed = strikethrough + muted)
- Edit button → opens `ListItemSheet`
- Delete button

**List Item Sheet** (`src/components/lists/list-item-sheet.tsx`):
- Create or edit mode
- Text input
- Category selector (if list has categories)
- Submit: "Add Item" / "Save Changes"

**Preferences** (`useListPreferences`):
- Family-wide `showCompletedByDefault` flag
- Stored per-family in API, falls back to `true`

**States**:
- Loading: "Loading lists" text
- Error: "Lists could not be loaded" + "Try again" button
- Empty: "No lists yet" + "Create the first shared family list for groceries, errands, or anything else worth keeping together." + "Create first list" button
- List detail empty: "No items yet" + "Add the first item to get this list moving."
- All completed hidden: "No active items" + "Completed items are hidden for this list."

---

### 7. Photos Module (`src/components/photos-view.tsx`)

**Header**:
- Heading: "Family Photos" + "Upload Photo" button (primary)

**Photo Grid**:
- Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop
- Square aspect-ratio tiles
- Image + hover overlay with caption
- Hover: scale 105 + gradient overlay

**Lightbox**:
- Full-screen dark overlay (z-50)
- Large image (max 70vh height, rounded corners)
- Caption below
- Left/right chevron navigation buttons
- Close X button (top-right)
- Prev button disabled at index 0, next disabled at last photo

**Sample Photos** (8 hardcoded):
- Beach Day, Emma's Birthday, Mountain Hike, Dogo at the Park, Thanksgiving, Soccer Championship, Christmas Morning, Summer BBQ

---

### 8. Settings & Family Management

#### Sidebar Menu (`src/components/shared/sidebar-menu.tsx`):
- Opens over content with backdrop blur
- Header: family name + "Calendar Settings" subtitle + X close button
- Family Members section:
  - Label: "Family Members"
  - List of member buttons (avatar + name)
  - Tap → `MemberProfileModal`
- Menu items:
  - "Family Settings" → `FamilySettingsModal`
  - "Sign Out" → logout
- Version footer: "v0.3.8"

#### Family Settings Modal (`src/components/settings/family-settings-modal.tsx`):
- Family Name section: input + Save button (disabled until dirty)
- Family Members section:
  - `MemberCard` list (same as onboarding)
  - "Add" button → `MemberFormModal`
  - Max 7 members reached message
- Danger Zone:
  - "Reset Family" with warning text
  - Confirmation dialog: "Yes, Reset Everything" / Cancel
  - Resets family and returns to onboarding

#### Member Profile Modal (`src/components/settings/member-profile-modal.tsx`):
- Edit name, color, avatar URL, email
- Save / Cancel buttons

#### Member Form Modal (`src/components/onboarding/member-form-modal.tsx`):
- Add or Edit mode
- Name input
- Color picker (7 colors as circles)
- Used colors visually disabled
- Existing name conflict validation
- Submit: "Add Member" / "Save Changes"

---

### 9. Navigation Structure

#### Desktop: `NavigationTabs` (vertical sidebar, 80px wide)
- Calendar icon + label
- Lists icon + label
- Chores icon + label
- Meals icon + label
- Photos icon + label
- Active tab: primary background, white text
- Inactive: muted, hover: bg-muted

#### Mobile: `MobileBottomNav` (bottom tab bar, 6 tabs)
- Home (house icon) — returns to home dashboard (null module)
- Calendar
- Lists
- Chores
- Meals
- Photos
- Active: primary background, shadow, filled icon
- Safe-area-aware padding at bottom

---

### 10. App Header (`src/components/shared/app-header.tsx`)

**Left side**:
- Hamburger menu button (triggers sidebar)
- Family name (or "Family Hub" default)
- Date/time on desktop (hidden on mobile)

**Right side**:
- Weather widget (desktop only): sun + cloud icon + "72°"
- Family member color dots (desktop, max 6)
- Settings gear icon

---

### 11. Global UI Components

**Button** (shadcn/ui):
- Variants: default (primary), destructive, outline, ghost, secondary
- Sizes: default, sm, lg, icon
- States: default, hover, active, disabled, loading (spinner)
- Used throughout all views

**Input** (shadcn/ui):
- Text, password types
- Error state (red border)
- Error message below

**Label** (shadcn/ui):
- Text label + htmlFor association

**Dialog** (Radix UI):
- `DialogContent` with optional `onClose` handler
- `DialogHeader` with `DialogTitle`
- `DialogDescription`
- `DialogFooter`

**DatePicker** (react-day-picker based):
- Calendar popup
- Range selection support (fromDate for end date validation)

**TimePicker** (`src/components/ui/time-picker.tsx`):
- Grid/select dropdown for hours and minutes
- 12-hour or 24-hour format

**MemberAvatar** (`src/components/calendar/components/member-avatar.tsx`):
- Circle with initial, colored background
- Sizes: sm (24px), md (32px), lg (40px)
- Variants: filled (solid bg) or ring (border only, transparent center)

**Toaster** (`src/components/ui/toaster.tsx`):
- Toast notifications for success/error feedback
- Used after API mutations

**Color Picker** (`src/components/ui/color-picker.tsx`):
- 7 color circles for member selection
- Used in onboarding and settings

---

### 12. State Management

**Zustand Stores** (`src/stores/`):
- `app-store.ts`: activeModule (calendar/lists/chores/meals/photos/null), sidebar open state, `setActiveModule`, `openSidebar`, `closeSidebar`
- `calendar-store.ts`: currentDate, calendarView (daily/weekly/monthly/schedule), filter (selectedMembers array, showAllDayEvents), modals state (add event, edit event, detail modal), `goToToday`, `goToPrevious`, `goToNext`, `setDate`, `selectDateAndSwitchToDaily`, `setCalendarView`, `toggleMember`, `initializeSelectedMembers`, `openAddEventModal`, `closeAddEventModal`, `openEditModal`, `closeEditModal`, `openDetailModal`, `closeDetailModal`
- `family-store.ts`: hydration state only (`_hasHydrated`)
- `auth-store.ts`: hydration state + `isAuthenticated`, `setHasHydrated`, `setAuthenticated`

**TanStack Query Hooks** (`src/api/hooks/`):
- `useCalendarEvents(dateRange)` → fetches events for date range
- `useFamilyMembers()` → family members array
- `useFamilyName()` → family name string
- `useChores()` → chores array
- `useLists()` → list summaries
- `useList(listId)` → full list detail with items
- `useListPreferences()` → family-wide preferences
- `useCreateEvent`, `useUpdateEvent`, `useDeleteEvent`
- `useCreateChore`, `useUpdateChore`, `useDeleteChore`
- `useAddMember`, `useUpdateMember`, `useRemoveMember`
- `useUpdateFamily`, `useDeleteFamily`
- `useLogin`, `useRegister`, `useLogout`
- `useCheckUsername` (debounced availability check)

**Query Provider** (`src/providers/query-provider.tsx`):
- `QueryClient` with sensible defaults (staleTime 30s, gcTime 5min)
- Devtools in development

---

### 13. Mock API / MSW

The app uses **MSW (Mock Service Worker)** for API mocking during development and tests. All handlers are in `src/test/mocks/handlers.ts`:

**In-memory stores** (reset between tests):
- `mockEvents[]` — calendar events
- `mockChores[]` — chores
- `mockFamily` — family data (null initially)
- `mockUsers[]` — user credentials
- `mockLists[]` — shopping/to-do/general lists

**Handlers cover**:
- Auth: login, register, check-username
- Family: get, update, delete, add member, update member, remove member
- Calendar: CRUD events
- Chores: CRUD chores
- Lists: CRUD lists + list items + preferences
- Google Calendar: status, calendars (disconnected by default)

**Calendar events** support:
- Single events
- Recurring events (RRule)
- Multi-day events
- All-day events
- Member assignment
- Date range filtering
- Member filtering

---

### 14. Constants & Utilities

**`src/lib/time-utils.ts`**: parseLocalDate, formatLocalDate, getSmartDefaultTimes, getEventKey, getTimeInMinutes, parseTime, compareEventsByTime, isEventOnDate, DAY_INITIALS, CALENDAR_START_HOUR (= 6)

**`src/lib/recurrence-utils.ts`**: buildRRule, formatRecurrenceLabel

**`src/lib/utils.ts`**: cn() for className merging, other utilities

**`src/lib/constants.ts`**: AUTH_TOKEN_STORAGE_KEY, FAMILY_STORAGE_KEY

**`src/lib/types/`**: All TypeScript interfaces — FamilyData, FamilyMember, CalendarEvent, Chore, ListDetail, ListItem, MealPlan, etc.

**`src/lib/validations/`**: Zod schemas for forms — loginFormSchema, credentialsFormSchema, eventFormSchema, memberFormSchema, familyNameSchema

---

### 15. Color System

**CSS Variables** (`src/index.css`):
- Background: `oklch(0.98 0.01 85)` (warm cream)
- Foreground: `oklch(0.25 0.02 250)`
- Primary: `oklch(0.55 0.18 285)` (purple)
- Secondary: `oklch(0.96 0.015 85)`
- Muted: `oklch(0.94 0.02 85)`
- Destructive: `oklch(0.65 0.2 25)`
- Border: `oklch(0.88 0.02 85)`
- Input: `oklch(0.92 0.01 85)`

**Member Colors** (7):
- Coral: `oklch(0.57 0.135 31)`
- Teal: `oklch(0.556 0.079 192)`
- Green: `oklch(0.535 0.095 146)`
- Purple: `oklch(0.514 0.14 296)`
- Yellow: `oklch(0.548 0.105 82)`
- Pink: `oklch(0.551 0.131 354)`
- Orange: `oklch(0.575 0.119 56)`

**Font**: Nunito (sans-serif)

---

### 16. PWA / Offline

The app is configured as a PWA with Vite PWA plugin (`vite.config.ts`):
- Service worker registration
- Offline support noted as "coming soon" in README
- Web app manifest with icons
- iOS splash screen / standalone mode

---

### 17. Testing

- **Vitest** for unit/integration tests (390+ tests per README)
- **Playwright** for E2E tests
- Test files co-located: `src/**/*.test.tsx`, `src/test/` for mocks/utilities
- E2E tests in `e2e/` directory
- MSW handlers for API mocking in tests
- Store auto-reset via `src/test/setup.ts`
- `seedCalendarStore`, `seedFamilyStore`, `seedAuthStore` helpers

---

### 18. Build & Dev Commands

```bash
npm run dev          # localhost:5173
npm run build        # tsc + vite build
npm run lint         # biome check
npm run lint:fix     # biome check --write
npm run format       # biome format --write
npm run test         # vitest watch mode
npm run test:ui      # vitest UI
npm run test:coverage # with coverage
npm run test:e2e     # playwright
npm run test:e2e:ui  # playwright UI
```

---

*App breakdown created: May 2026*
*Source repo: https://github.com/joe-bor/FamilyHub*