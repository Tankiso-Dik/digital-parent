# Digital Parent — Refactoring Plan (Convex)

## Overview

Refactor FamilyHub into **Digital Parent** — a family organization app with Convex backend.
Keep existing working features (Calendar, Chores, Lists, Family/Members), discard dead weight, and wire everything to a real Convex database.

**Why Convex:**
- TypeScript-first schema (no SQL migrations)
- Built-in auth (minimal config)
- Real-time subscriptions out of the box
- `npx convex dev` to run locally
- Fastest path from zero to working backend

---

## Phase 1: Discard Dead Features

### 1.1 Files to Delete

| Feature         | Files to Remove                                                    |
| --------------- | ------------------------------------------------------------------ |
| App Usage       | `src/components/digital-habits-view.tsx`                           |
| Google Calendar | `src/components/settings/google-calendar-section.tsx`              |
|                 | `src/components/settings/google-calendar-section.test.tsx`          |
|                 | `src/components/settings/google-calendar-picker-modal.tsx`         |
|                 | `src/components/settings/google-calendar-picker-modal.test.tsx`    |
|                 | `src/api/services/google-calendar.service.ts`                      |
|                 | `src/api/hooks/use-google-calendar.ts`                             |
|                 | `src/api/hooks/use-google-calendar.test.tsx`                        |
| Photos          | `src/components/photos-view.tsx`                                   |
| Meals           | `src/components/meals-view.tsx`                                    |
|                 | `src/lib/types/meals.ts`                                           |
| Demo Mode       | `src/lib/demo-data.ts`                                             |

### 1.2 Clean Up Exports

**`src/api/index.ts`** — Remove:
- `googleCalendarKeys`
- `useGoogleCalendars`
- `useGoogleConnectionStatus`
- `useDisconnectGoogle`
- `useSyncGoogleCalendar`
- `useUpdateGoogleCalendars`
- `googleCalendarService`

**`src/api/hooks/index.ts`** — Remove Google Calendar hooks

**`src/api/services/index.ts`** — Remove `googleCalendarService`

**`src/components/settings/index.ts`** — Remove Google Calendar exports

**`src/stores/index.ts`** — Remove any Google Calendar-related state

**`src/lib/types/index.ts`** — Remove `meals.ts` export

**`src/App.tsx`** — Remove lazy imports for:
- MealsView
- PhotosView
- DigitalHabitsView (replace with simpler default)

### 1.3 Navigation Cleanup

**`src/components/shared/navigation-tabs.tsx`** — Remove:
- Meals tab
- Photos tab

**`src/components/shared/mobile-bottom-nav.tsx`** — Remove:
- Meals tab
- Photos tab

---

## Phase 2: Convex Setup

### 2.1 Initialize Convex

```bash
# From project root
npx convex init

# This creates:
# - convex/ directory (your backend code)
# - convex.json (project config)
# - .gitignore entry for convex/_generated
```

### 2.2 Create Convex Schema

Create `convex/schema.ts`:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================================
  // Auth
  // ============================================================================
  // Convex handles auth automatically with built-in session management.
  // User identity is available via `await auth.getUserIdentity()` in mutations.

  // ============================================================================
  // Tables
  // ============================================================================

  families: defineTable({
    name: v.string(),
  }).index("by_owner", ["owner"]),

  familyMembers: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    color: v.string(), // "coral" | "teal" | "green" | "purple" | "yellow" | "pink" | "orange"
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_family", ["familyId"]),

  events: defineTable({
    familyId: v.id("families"),
    title: v.string(),
    date: v.string(), // "yyyy-MM-dd"
    startTime: v.string(), // "HH:mm"
    endTime: v.string(), // "HH:mm"
    endDate: v.optional(v.string()),
    memberId: v.id("familyMembers"),
    isAllDay: v.boolean(),
    location: v.optional(v.string()),
    recurrenceRule: v.optional(v.string()),
    recurringEventId: v.optional(v.id("events")),
    description: v.optional(v.string()),
    source: v.optional(v.string()), // "NATIVE" | "GOOGLE"
    htmlLink: v.optional(v.string()),
  })
    .index("by_family", ["familyId"])
    .index("by_date", ["familyId", "date"]),

  chores: defineTable({
    familyId: v.id("families"),
    title: v.string(),
    assignedToMemberId: v.id("familyMembers"),
    dueDate: v.optional(v.string()),
    completed: v.boolean(),
    completedAt: v.optional(v.string()),
  })
    .index("by_family", ["familyId"])
    .index("by_assignee", ["assignedToMemberId"]),

  lists: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    kind: v.union(v.literal("grocery"), v.literal("to-do"), v.literal("general")),
    categoryDisplayMode: v.optional(v.string()),
    showCompletedOverride: v.optional(v.boolean()),
  }).index("by_family", ["familyId"]),

  listCategories: defineTable({
    listId: v.id("lists"),
    name: v.string(),
    kind: v.string(),
    seeded: v.boolean(),
    sortOrder: v.number(),
  }).index("by_list", ["listId"]),

  listItems: defineTable({
    listId: v.id("lists"),
    categoryId: v.optional(v.id("listCategories")),
    text: v.string(),
    completed: v.boolean(),
    completedAt: v.optional(v.string()),
  }).index("by_list", ["listId"]),

  listPreferences: defineTable({
    familyId: v.id("families"),
    showCompletedByDefault: v.boolean(),
  }).index("by_family", ["familyId"]),
});
```

### 2.3 Convex Configuration

Update `convex.json`:

```json
{
  "functions": "convex/",
  "node": "18",
  "auth": {
    "providers": [
      {
        "name": "email",
        "emailVerificationLink": "mailto:verify@example.com"
      }
    ],
    "allowLocalhost": true
  }
}
```

### 2.4 Install Convex Client

```bash
npm install convex
```

### 2.5 Create Convex Client

Create `src/lib/convex.ts`:

```typescript
import { ConvexProvider } from "convex/react";
import { ConvexClient } from "convex/client";

export const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL!);
```

Add to `src/providers/query-provider.tsx` or wrap the app directly:

```typescript
import { ConvexProvider } from "convex/react";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ConvexProvider>
  );
}
```

### 2.6 Environment Variables

Create `.env.local`:

```
VITE_CONVEX_URL=https://your-project-abc123.convex.cloud
```

Get the URL from the Convex dashboard after running `npx convex dev`.

---

## Phase 3: Convex Backend Functions

Create your backend API as Convex **named queries and mutations** — no separate HTTP server needed.

### 3.1 Auth Helpers

Create `convex/auth.ts`:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return { identity };
  },
});
```

### 3.2 Family Functions

Create `convex/family.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getFamily = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get family for this user
    const families = await ctx.table("families").filter((q) =>
      q.eq(q.field("owner"), identity.subject)
    ).first();

    if (!families) return { data: null };

    const members = await ctx.table("familyMembers")
      .filter((q) => q.eq(q.field("familyId"), families._id))
      .collect();

    return {
      data: {
        id: families._id,
        name: families.name,
        members: members.map((m) => ({
          id: m._id,
          name: m.name,
          color: m.color,
          avatarUrl: m.avatarUrl,
          email: m.email,
        })),
        createdAt: families._creationTime,
      },
    };
  },
});

export const createFamily = mutation({
  args: { name: v.string(), members: v.array(v.object({
    name: v.string(),
    color: v.string(),
    email: v.optional(v.string()),
  }))},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const familyId = await ctx.table("families").insert({
      name: args.name,
      owner: identity.subject,
    });

    // Insert initial members
    for (const member of args.members) {
      await ctx.table("familyMembers").insert({
        familyId,
        name: member.name,
        color: member.color,
        email: member.email,
      });
    }

    // Create default list preferences
    await ctx.table("listPreferences").insert({
      familyId,
      showCompletedByDefault: true,
    });

    return { data: { id: familyId, name: args.name } };
  },
});

export const updateFamily = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.table("families")
      .filter((q) => q.eq(q.field("owner"), identity.subject))
      .first();

    if (!family) throw new Error("No family found");

    await ctx.table("families").patch(family._id, { name: args.name });
    return { data: { id: family._id, name: args.name } };
  },
});

export const addMember = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.table("families")
      .filter((q) => q.eq(q.field("owner"), identity.subject))
      .first();

    if (!family) throw new Error("No family found");

    const memberId = await ctx.table("familyMembers").insert({
      familyId: family._id,
      name: args.name,
      color: args.color,
      avatarUrl: args.avatarUrl,
      email: args.email,
    });

    return { data: { id: memberId, name: args.name, color: args.color } };
  },
});

export const updateMember = mutation({
  args: {
    id: v.id("familyMembers"),
    name: v.string(),
    color: v.string(),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    await ctx.table("familyMembers").patch(args.id, {
      name: args.name,
      color: args.color,
      avatarUrl: args.avatarUrl,
      email: args.email,
    });

    return { data: { id: args.id, name: args.name, color: args.color } };
  },
});

export const removeMember = mutation({
  args: { id: v.id("familyMembers") },
  handler: async (ctx, args) => {
    await ctx.table("familyMembers").delete(args.id);
  },
});

export const deleteFamily = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.table("families")
      .filter((q) => q.eq(q.field("owner"), identity.subject))
      .first();

    if (!family) return;

    // Delete all related data
    const members = await ctx.table("familyMembers")
      .filter((q) => q.eq(q.field("familyId"), family._id))
      .collect();

    for (const member of members) {
      await ctx.table("familyMembers").delete(member._id);
    }

    const events = await ctx.table("events")
      .filter((q) => q.eq(q.field("familyId"), family._id))
      .collect();

    for (const event of events) {
      await ctx.table("events").delete(event._id);
    }

    const chores = await ctx.table("chores")
      .filter((q) => q.eq(q.field("familyId"), family._id))
      .collect();

    for (const chore of chores) {
      await ctx.table("chores").delete(chore._id);
    }

    const lists = await ctx.table("lists")
      .filter((q) => q.eq(q.field("familyId"), family._id))
      .collect();

    for (const list of lists) {
      const items = await ctx.table("listItems")
        .filter((q) => q.eq(q.field("listId"), list._id))
        .collect();
      for (const item of items) {
        await ctx.table("listItems").delete(item._id);
      }
      const categories = await ctx.table("listCategories")
        .filter((q) => q.eq(q.field("listId"), list._id))
        .collect();
      for (const cat of categories) {
        await ctx.table("listCategories").delete(cat._id);
      }
      await ctx.table("lists").delete(list._id);
    }

    await ctx.table("families").delete(family._id);
  },
});
```

### 3.3 Calendar Events Functions

Create `convex/events.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getEvents = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    memberId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.table("families")
      .filter((q) => q.eq(q.field("owner"), identity.subject))
      .first();

    if (!family) return { data: [] };

    let eventsQuery = ctx.table("events")
      .filter((q) => q.and(
        q.eq(q.field("familyId"), family._id),
        q.gte(q.field("date"), args.startDate),
        q.lte(q.field("date"), args.endDate)
      ));

    const events = await eventsQuery.collect();

    return {
      data: events.map((e) => ({
        id: e._id,
        title: e.title,
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        endDate: e.endDate,
        memberId: e.memberId,
        isAllDay: e.isAllDay,
        location: e.location,
        recurrenceRule: e.recurrenceRule,
        recurringEventId: e.recurringEventId,
        description: e.description,
        source: e.source ?? "NATIVE",
      })),
    };
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    endDate: v.optional(v.string()),
    memberId: v.id("familyMembers"),
    isAllDay: v.boolean(),
    location: v.optional(v.string()),
    recurrenceRule: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.table("families")
      .filter((q) => q.eq(q.field("owner"), identity.subject))
      .first();

    if (!family) throw new Error("No family found");

    const id = await ctx.table("events").insert({
      familyId: family._id,
      title: args.title,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      endDate: args.endDate,
      memberId: args.memberId,
      isAllDay: args.isAllDay,
      location: args.location,
      recurrenceRule: args.recurrenceRule,
      description: args.description,
      source: "NATIVE",
    });

    return { data: { id, ...args } };
  },
});

export const updateEvent = mutation({
  args: {
    id: v.id("events"),
    title: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    endDate: v.optional(v.string()),
    memberId: v.id("familyMembers"),
    isAllDay: v.boolean(),
    location: v.optional(v.string()),
    recurrenceRule: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.table("events").patch(id, data);
    return { data: args };
  },
});

export const deleteEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    await ctx.table("events").delete(args.id);
  },
});

export const updateInstance = mutation({
  args: {
    parentId: v.id("events"),
    instanceDate: v.string(),
    title: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    memberId: v.id("familyMembers"),
    isAllDay: v.boolean(),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // For simplicity, create an exception event with recurringEventId set
    const { parentId, instanceDate, ...data } = args;
    await ctx.table("events").insert({
      ...data,
      familyId: (await ctx.table("events").get(parentId))!.familyId,
      endDate: undefined,
      recurrenceRule: undefined,
      recurringEventId: parentId,
      source: "NATIVE",
    });
  },
});

export const deleteInstance = mutation({
  args: {
    parentId: v.id("events"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the instance for this date and delete it
    const instances = await ctx.table("events")
      .filter((q) => q.and(
        q.eq(q.field("recurringEventId"), args.parentId),
        q.eq(q.field("date"), args.date)
      ))
      .collect();

    for (const instance of instances) {
      await ctx.table("events").delete(instance._id);
    }
  },
});
```

### 3.4 Chores Functions

Create `convex/chores.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getChores = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.table("families")
      .filter((q) => q.eq(q.field("owner"), identity.subject))
      .first();

    if (!family) return { data: [] };

    const chores = await ctx.table("chores")
      .filter((q) => q.eq(q.field("familyId"), family._id))
      .collect();

    return {
      data: chores.map((c) => ({
        id: c._id,
        title: c.title,
        assignedToMemberId: c.assignedToMemberId,
        dueDate: c.dueDate,
        completed: c.completed,
        completedAt: c.completedAt,
        createdAt: c._creationTime,
        updatedAt: c._creationTime,
      })),
    };
  },
});

export const createChore = mutation({
  args: {
    title: v.string(),
    assignedToMemberId: v.id("familyMembers"),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.table("families")
      .filter((q) => q.eq(q.field("owner"), identity.subject))
      .first();

    if (!family) throw new Error("No family found");

    const id = await ctx.table("chores").insert({
      familyId: family._id,
      title: args.title,
      assignedToMemberId: args.assignedToMemberId,
      dueDate: args.dueDate,
      completed: false,
      completedAt: undefined,
    });

    return { data: { id, ...args, completed: false } };
  },
});

export const updateChore = mutation({
  args: {
    id: v.id("chores"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const chore = await ctx.table("chores").get(args.id);
    if (!chore) throw new Error("Chore not found");

    await ctx.table("chores").patch(args.id, {
      completed: args.completed,
      completedAt: args.completed ? new Date().toISOString() : undefined,
    });

    return { data: { id: args.id, completed: args.completed } };
  },
});

export const deleteChore = mutation({
  args: { id: v.id("chores") },
  handler: async (ctx, args) => {
    await ctx.table("chores").delete(args.id);
  },
});
```

### 3.5 Lists Functions

Create `convex/lists.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getLists = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.table("families")
      .filter((q) => q.eq(q.field("owner"), identity.subject))
      .first();

    if (!family) return { data: [] };

    const lists = await ctx.table("lists")
      .filter((q) => q.eq(q.field("familyId"), family._id))
      .collect();

    return {
      data: lists.map((l) => ({
        id: l._id,
        name: l.name,
        kind: l.kind,
        totalItems: 0,
        completedItems: 0,
      })),
    };
  },
});

export const getListDetail = query({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const list = await ctx.table("lists").get(args.listId);
    if (!list) throw new Error("List not found");

    const categories = await ctx.table("listCategories")
      .filter((q) => q.eq(q.field("listId"), args.listId))
      .collect();

    const items = await ctx.table("listItems")
      .filter((q) => q.eq(q.field("listId"), args.listId))
      .collect();

    return {
      data: {
        id: list._id,
        name: list.name,
        kind: list.kind,
        categoryDisplayMode: list.categoryDisplayMode ?? "flat",
        showCompletedOverride: list.showCompletedOverride,
        categories: categories.map((c) => ({
          id: c._id,
          kind: c.kind,
          name: c.name,
          seeded: c.seeded,
          sortOrder: c.sortOrder,
        })),
        items: items.map((i) => ({
          id: i._id,
          text: i.text,
          completed: i.completed,
          completedAt: i.completedAt,
          categoryId: i.categoryId,
          createdAt: i._creationTime,
          updatedAt: i._creationTime,
        })),
        createdAt: list._creationTime,
        updatedAt: list._creationTime,
      },
    };
  },
});

export const createList = mutation({
  args: {
    name: v.string(),
    kind: v.union(v.literal("grocery"), v.literal("to-do"), v.literal("general")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.table("families")
      .filter((q) => q.eq(q.field("owner"), identity.subject))
      .first();

    if (!family) throw new Error("No family found");

    const id = await ctx.table("lists").insert({
      familyId: family._id,
      name: args.name,
      kind: args.kind,
      categoryDisplayMode: args.kind === "general" ? "flat" : "grouped",
    });

    // Seed categories for grocery/to-do
    if (args.kind === "grocery") {
      const categories = ["Produce", "Dairy", "Pantry", "Frozen", "Bakery"];
      for (let i = 0; i < categories.length; i++) {
        await ctx.table("listCategories").insert({
          listId: id,
          name: categories[i],
          kind: "grocery",
          seeded: true,
          sortOrder: i,
        });
      }
    } else if (args.kind === "to-do") {
      const categories = ["Urgent", "Soon", "Later"];
      for (let i = 0; i < categories.length; i++) {
        await ctx.table("listCategories").insert({
          listId: id,
          name: categories[i],
          kind: "to-do",
          seeded: true,
          sortOrder: i,
        });
      }
    }

    return { data: { id, name: args.name, kind: args.kind } };
  },
});

export const updateList = mutation({
  args: {
    id: v.id("lists"),
    categoryDisplayMode: v.optional(v.string()),
    showCompletedOverride: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.table("lists").patch(id, data);
    return { data: { id, ...data } };
  },
});

export const createListItem = mutation({
  args: {
    listId: v.id("lists"),
    text: v.string(),
    categoryId: v.optional(v.id("listCategories")),
  },
  handler: async (ctx, args) => {
    const id = await ctx.table("listItems").insert({
      listId: args.listId,
      categoryId: args.categoryId,
      text: args.text,
      completed: false,
    });
    return { data: { id, text: args.text, completed: false } };
  },
});

export const updateListItem = mutation({
  args: {
    listId: v.id("lists"),
    itemId: v.id("listItems"),
    text: v.string(),
    completed: v.boolean(),
    categoryId: v.optional(v.id("listCategories")),
  },
  handler: async (ctx, args) => {
    await ctx.table("listItems").patch(args.itemId, {
      text: args.text,
      completed: args.completed,
      completedAt: args.completed ? new Date().toISOString() : undefined,
      categoryId: args.categoryId,
    });
    return { data: { id: args.itemId, text: args.text, completed: args.completed } };
  },
});

export const deleteListItem = mutation({
  args: { itemId: v.id("listItems") },
  handler: async (ctx, args) => {
    await ctx.table("listItems").delete(args.itemId);
  },
});

export const clearCompleted = mutation({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    const items = await ctx.table("listItems")
      .filter((q) => q.and(
        q.eq(q.field("listId"), args.listId),
        q.eq(q.field("completed"), true)
      ))
      .collect();

    for (const item of items) {
      await ctx.table("listItems").delete(item._id);
    }

    return { data: { removedCount: items.length } };
  },
});

export const getListPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.table("families")
      .filter((q) => q.eq(q.field("owner"), identity.subject))
      .first();

    if (!family) return { data: { showCompletedByDefault: true } };

    const prefs = await ctx.table("listPreferences")
      .filter((q) => q.eq(q.field("familyId"), family._id))
      .first();

    return { data: { showCompletedByDefault: prefs?.showCompletedByDefault ?? true } };
  },
});

export const updateListPreferences = mutation({
  args: { showCompletedByDefault: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const family = await ctx.table("families")
      .filter((q) => q.eq(q.field("owner"), identity.subject))
      .first();

    if (!family) throw new Error("No family found");

    const existing = await ctx.table("listPreferences")
      .filter((q) => q.eq(q.field("familyId"), family._id))
      .first();

    if (existing) {
      await ctx.table("listPreferences").patch(existing._id, args);
    } else {
      await ctx.table("listPreferences").insert({
        familyId: family._id,
        showCompletedByDefault: args.showCompletedByDefault,
      });
    }

    return { data: args };
  },
});
```

---

## Phase 4: Frontend — Convex Integration

### 4.1 Update API Services

The services in `src/api/services/` need to call Convex functions instead of making HTTP requests.

**`src/api/services/family.service.ts`** — Replace with:

```typescript
import { functions } from "@/lib/convex";

export const familyService = {
  async getFamily() {
    return await functions.call("family:getFamily", {});
  },

  async createFamily(request: { name: string; members: any[] }) {
    return await functions.call("family:createFamily", request);
  },

  async updateFamily(request: { name: string }) {
    return await functions.call("family:updateFamily", request);
  },

  async addMember(request: { name: string; color: string; email?: string }) {
    return await functions.call("family:addMember", request);
  },

  async updateMember(id: string, request: { name: string; color: string; email?: string }) {
    return await functions.call("family:updateMember", { id, ...request });
  },

  async removeMember(id: string) {
    return await functions.call("family:removeMember", { id });
  },

  async deleteFamily() {
    return await functions.call("family:deleteFamily", {});
  },
};
```

Apply the same pattern to:
- `calendar.service.ts` → calls to `events:getEvents`, `events:createEvent`, etc.
- `chores.service.ts` → calls to `chores:getChores`, `chores:createChore`, etc.
- `lists.service.ts` → calls to `lists:getLists`, `lists:createList`, etc.

### 4.2 Create Convex Function Wrapper

Create `src/lib/convex.ts`:

```typescript
import { ConvexProvider, useConvex } from "convex/react";

// Use the generated types from `npx convex dev`
// This gives you fully typed function calls
import type { ConvexFunctions } from "../convex/_generated/server";

// The client instance
export { convex } from "./convex-client";

// Provider is used in main.tsx or App.tsx
export { ConvexProvider };
```

Create `src/lib/convex-client.ts`:

```typescript
import { ConvexClient } from "convex/client";

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Missing VITE_CONVEX_URL environment variable");
}

export const convex = new ConvexClient(convexUrl);

// Type-safe function caller
export const functions = {
  call: async <Name extends keyof ConvexFunctions>(
    name: Name,
    args: Parameters<ConvexFunctions[Name]>[0]
  ): Promise<ReturnType<ConvexFunctions[Name]>> => {
    return await convex.query(name, args);
  },
};
```

Wait, that's not quite right. Convex uses a different pattern. Let me correct:

**`src/lib/convex.ts`** (correct approach):

```typescript
import { ConvexClient } from "convex/client";

const url = import.meta.env.VITE_CONVEX_URL;

if (!url) {
  throw new Error("Missing VITE_CONVEX_URL environment variable");
}

export const convex = new ConvexClient(url);

// Helper to call named queries and mutations
export async function callFunction<
  Name extends string,
  Args extends Record<string, unknown>,
  ReturnType
>(
  name: Name,
  args: Args
): Promise<ReturnType> {
  return await convex.mutation(name, args);
}

export async function callQuery<
  Name extends string,
  Args extends Record<string, unknown>,
  ReturnType
>(
  name: Name,
  args: Args
): Promise<ReturnType> {
  return await convex.query(name, args);
}
```

Actually the cleanest approach is to let the generated client handle typing. After running `npx convex dev`, you'll have `convex/_generated/server.d.ts` with all your function types. Then you can do:

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// In components:
const events = useQuery(api.events.getEvents, { startDate, endDate });
const createEvent = useMutation(api.events.createEvent);
```

This is the **idiomatic Convex approach** — use the generated `api` namespace directly in React with hooks. No manual service wrappers needed.

### 4.3 Update TanStack Query Hooks

Since Convex hooks replace HTTP calls, you'll restructure the hooks:

**`src/api/hooks/use-family.ts`** — becomes:

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useFamily() {
  return useQuery(api.family.getFamily);
}

export function useCreateFamily() {
  return useMutation(api.family.createFamily);
}

export function useUpdateFamily() {
  return useMutation(api.family.updateFamily);
}

export function useAddMember() {
  return useMutation(api.family.addMember);
}

export function useUpdateMember() {
  return useMutation(api.family.updateMember);
}

export function useRemoveMember() {
  return useMutation(api.family.removeMember);
}

export function useDeleteFamily() {
  return useMutation(api.family.deleteFamily);
}
```

Apply the same pattern to all other hooks.

### 4.4 Remove HTTP Client

Since Convex handles all data fetching, you can remove or repurpose `src/api/client/http-client.ts`. The Convex React hooks replace the need for manual HTTP calls.

---

## Phase 5: UI Refinements

### 5.1 Rename App

- **`src/components/shared/app-header.tsx`** — Change "FamilyHub" to "Digital Parent"
- **`index.html`** — Change `<title>` to "Digital Parent"
- Search for any other hardcoded "FamilyHub" strings and replace

### 5.2 Simplify Onboarding

Replace `src/components/onboarding/onboarding-welcome.tsx` with a simple welcome screen:

```tsx
export function OnboardingWelcome() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Digital Parent</h1>
      <p className="text-muted-foreground text-center">
        Organize your family's schedule, tasks, and shopping lists in one place.
      </p>
    </div>
  );
}
```

The rest of onboarding (family name, members, credentials) can stay as-is.

### 5.3 Ensure Navigation is Clean

`NavigationTabs` should show: Home, Calendar, Chores, Lists

`MobileBottomNav` should show: Home, Calendar, Chores, Lists

---

## Phase 6: Demo Data Setup

### 6.1 Run Convex Locally

```bash
npx convex dev
```

This will:
1. Start the Convex dev server
2. Generate TypeScript types for your schema
3. Create the database at `convex/data/` (local SQLite)

### 6.2 Seed Demo Data

Create `convex/seed.ts`:

```typescript
import { mutation } from "./_generated/server";

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    // This should only run once, check if data already exists
    const existingFamily = await ctx.table("families").first();
    if (existingFamily) return { message: "Already seeded" };

    // Insert demo family
    const familyId = await ctx.table("families").insert({
      name: "The Thompsons",
      owner: "demo-user", // This would be the actual user ID in production
    });

    // Insert demo members
    const aliceId = await ctx.table("familyMembers").insert({
      familyId,
      name: "Alice Thompson",
      color: "coral",
      email: "alice@demo.com",
    });

    const emmaId = await ctx.table("familyMembers").insert({
      familyId,
      name: "Emma Thompson",
      color: "green",
      email: "emma@demo.com",
    });

    const jackId = await ctx.table("familyMembers").insert({
      familyId,
      name: "Jack Thompson",
      color: "purple",
      email: "jack@demo.com",
    });

    // Insert demo events
    const today = new Date();
    const addDays = (d: Date, days: number) => {
      const next = new Date(d);
      next.setDate(d.getDate() + days);
      return next.toISOString().split("T")[0];
    };

    await ctx.table("events").insert({
      familyId,
      title: "School drop-off",
      date: addDays(today, 1),
      startTime: "08:00",
      endTime: "08:30",
      memberId: aliceId,
      isAllDay: false,
      location: "Maple Elementary",
    });

    await ctx.table("events").insert({
      familyId,
      title: "Emma soccer practice",
      date: addDays(today, 2),
      startTime: "16:30",
      endTime: "17:30",
      memberId: emmaId,
      isAllDay: false,
      location: "Community fields",
    });

    await ctx.table("events").insert({
      familyId,
      title: "Jack dentist checkup",
      date: addDays(today, 3),
      startTime: "10:00",
      endTime: "10:45",
      memberId: jackId,
      isAllDay: false,
      location: "Dr. Rivera",
    });

    // Insert demo chores
    await ctx.table("chores").insert({
      familyId,
      title: "Homework completed",
      assignedToMemberId: emmaId,
      dueDate: addDays(today, 1),
      completed: false,
    });

    await ctx.table("chores").insert({
      familyId,
      title: "Brush teeth without reminders",
      assignedToMemberId: jackId,
      dueDate: addDays(today, 2),
      completed: false,
    });

    await ctx.table("chores").insert({
      familyId,
      title: "Read 30 minutes",
      assignedToMemberId: emmaId,
      dueDate: addDays(today, 5),
      completed: true,
      completedAt: new Date().toISOString(),
    });

    // Insert demo grocery list
    const groceryListId = await ctx.table("lists").insert({
      familyId,
      name: "Weekly Groceries",
      kind: "grocery",
      categoryDisplayMode: "grouped",
    });

    const produceCatId = await ctx.table("listCategories").insert({
      listId: groceryListId,
      name: "Produce",
      kind: "grocery",
      seeded: true,
      sortOrder: 0,
    });

    const dairyCatId = await ctx.table("listCategories").insert({
      listId: groceryListId,
      name: "Dairy",
      kind: "grocery",
      seeded: true,
      sortOrder: 1,
    });

    await ctx.table("listItems").insert({
      listId: groceryListId,
      categoryId: produceCatId,
      text: "Milk",
      completed: false,
    });

    await ctx.table("listItems").insert({
      listId: groceryListId,
      categoryId: produceCatId,
      text: "Apples",
      completed: false,
    });

    await ctx.table("listItems").insert({
      listId: groceryListId,
      categoryId: dairyCatId,
      text: "Cheese",
      completed: false,
    });

    // Insert list preferences
    await ctx.table("listPreferences").insert({
      familyId,
      showCompletedByDefault: true,
    });

    return { message: "Demo data seeded" };
  },
});
```

### 6.3 Demo Accounts

For demo purposes, create auth-handled accounts. Since Convex uses its own auth system, you'll need to configure email/password auth in `convex.json`:

```json
{
  "auth": {
    "providers": [
      {
        "name": "email",
        "emailVerificationLink": "mailto:verify@example.com"
      }
    ]
  }
}
```

To seed data for specific users, you'd typically:
1. Run the app, register with alice@demo.com
2. Call `seedDemoData` mutation
3. Repeat for emma@demo.com and jack@demo.com

Alternatively, seed based on a "demo mode" flag in localStorage for the presentation.

---

## Phase 7: Verification

### Test Checklist

- [ ] `npx convex dev` starts without errors
- [ ] Schema generates TypeScript types in `convex/_generated/`
- [ ] Register a new family
- [ ] Login with existing credentials
- [ ] View family members on home screen
- [ ] Add a new family member
- [ ] Create a calendar event
- [ ] Edit a calendar event
- [ ] Delete a calendar event
- [ ] View chores
- [ ] Complete a chore
- [ ] Create a new chore
- [ ] Create a grocery list
- [ ] Add items to a grocery list
- [ ] Check off grocery items
- [ ] Clear completed items
- [ ] Logout

---

## File Changes Summary

### Files to DELETE:
- `src/components/digital-habits-view.tsx`
- `src/components/photos-view.tsx`
- `src/components/meals-view.tsx`
- `src/components/settings/google-calendar-section.tsx`
- `src/components/settings/google-calendar-section.test.tsx`
- `src/components/settings/google-calendar-picker-modal.tsx`
- `src/components/settings/google-calendar-picker-modal.test.tsx`
- `src/api/services/google-calendar.service.ts`
- `src/api/hooks/use-google-calendar.ts`
- `src/api/hooks/use-google-calendar.test.tsx`
- `src/lib/demo-data.ts`
- `src/lib/types/meals.ts`

### Files to CREATE:
- `convex/schema.ts`
- `convex/family.ts`
- `convex/events.ts`
- `convex/chores.ts`
- `convex/lists.ts`
- `convex/seed.ts` (optional)
- `src/lib/convex-client.ts`
- `.env.local` (VITE_CONVEX_URL)

### Files to MODIFY:
- `src/App.tsx` — remove lazy imports for removed modules, wrap with ConvexProvider
- `src/components/shared/navigation-tabs.tsx` — remove Meals/Photos tabs
- `src/components/shared/mobile-bottom-nav.tsx` — remove Meals/Photos tabs
- `src/components/onboarding/onboarding-welcome.tsx` — simplify
- `src/components/shared/app-header.tsx` — rename to "Digital Parent"
- `index.html` — update title
- `src/api/index.ts` — remove Google Calendar exports
- `src/api/hooks/index.ts` — remove Google Calendar hooks
- `src/api/services/index.ts` — remove googleCalendarService
- `src/api/services/*.ts` — rewrite to use Convex
- `src/api/hooks/*.ts` — rewrite to use Convex hooks
- `src/lib/types/index.ts` — remove meals.ts export
- `src/components/settings/index.ts` — remove Google exports
- `src/stores/index.ts` — remove Google Calendar state
- `package.json` — add `convex` dependency
- `convex.json` — add auth configuration
- `tsconfig.json` — ensure Convex generated types are included

### New Dependencies:
```
npm install convex
```

---

## Timeline

| Phase | Task                          | Estimated Time |
| ----- | ----------------------------- | ------------- |
| 1     | Discard dead features         | 30 min        |
| 2     | Convex init + schema         | 20 min        |
| 3     | Write Convex functions       | 1-2 hours     |
| 4     | Rewrite frontend hooks       | 1-2 hours     |
| 5     | UI refinements               | 30 min        |
| 6     | Demo data + accounts         | 15 min        |
| 7     | Verification + bug fixes      | 1 hour        |

**Total: ~4-5 hours**

---

## Key Differences from Supabase Plan

| Aspect         | Supabase                    | Convex                          |
| -------------- | --------------------------- | ------------------------------- |
| Database       | PostgreSQL                  | Built-in (SQLite locally)       |
| Auth           | Supabase Auth               | Convex built-in                 |
| API Style      | REST (httpClient)           | Functions (queries/mutations)   |
| Client         | Custom HTTP + TanStack      | Convex React hooks              |
| Schema         | SQL migration               | TypeScript schema               |
| Real-time      | Via Realtime                | Native subscriptions            |
| Migrations     | Manual SQL                  | Automatic                       |
| Deployment     | Railway / Supabase Hosting  | `npx convex dev` (local)        |

---

## Getting Help

- Convex Docs: https://docs.convex.dev
- Convex Discord: https://discord.gg/convex-dev
- Schema Reference: https://docs.convex.dev/database/schema