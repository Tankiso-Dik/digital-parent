import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  families: defineTable({
    name: v.string(),
    owner: v.string(),
  }).index("by_owner", ["owner"]),

  familyMembers: defineTable({
    familyId: v.id("families"),
    name: v.string(),
    color: v.string(),
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_family", ["familyId"]),

  events: defineTable({
    familyId: v.id("families"),
    title: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    endDate: v.optional(v.string()),
    memberId: v.id("familyMembers"),
    isAllDay: v.boolean(),
    location: v.optional(v.string()),
    recurrenceRule: v.optional(v.string()),
    recurringEventId: v.optional(v.id("events")),
    description: v.optional(v.string()),
    source: v.optional(v.string()),
    htmlLink: v.optional(v.string()),
  })
    .index("by_family", ["familyId"])
    .index("by_date", ["familyId", "date"])
    .index("by_recurring_event_and_date", ["recurringEventId", "date"]),

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
    kind: v.union(
      v.literal("grocery"),
      v.literal("to-do"),
      v.literal("general"),
    ),
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
  })
    .index("by_list", ["listId"])
    .index("by_list_and_completed", ["listId", "completed"]),

  listPreferences: defineTable({
    familyId: v.id("families"),
    showCompletedByDefault: v.boolean(),
  }).index("by_family", ["familyId"]),
});
