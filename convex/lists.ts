import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  creationTimeToString,
  requireFamilyList,
  requireUserFamily,
} from "./helpers";

const listKind = v.union(
  v.literal("grocery"),
  v.literal("to-do"),
  v.literal("general"),
);
const categoryDisplayMode = v.union(v.literal("grouped"), v.literal("flat"));
const optionalBooleanOverride = v.optional(v.union(v.boolean(), v.null()));
const optionalCategoryId = v.optional(
  v.union(v.id("listCategories"), v.null()),
);

const seededCategories: Record<"grocery" | "to-do", string[]> = {
  grocery: ["Produce", "Dairy", "Pantry", "Frozen", "Bakery"],
  "to-do": ["Urgent", "Soon", "Later"],
};

function mapCategory(category: {
  _id: string;
  name: string;
  kind: string;
  seeded: boolean;
  sortOrder: number;
}) {
  return {
    id: category._id,
    kind: category.kind,
    name: category.name,
    seeded: category.seeded,
    sortOrder: category.sortOrder,
  };
}

function mapItem(item: {
  _id: string;
  _creationTime: number;
  text: string;
  completed: boolean;
  completedAt?: string;
  categoryId?: string;
}) {
  const createdAt = creationTimeToString(item);

  return {
    id: item._id,
    text: item.text,
    completed: item.completed,
    completedAt: item.completedAt ?? null,
    categoryId: item.categoryId ?? null,
    createdAt,
    updatedAt: item.completedAt ?? createdAt,
  };
}

async function mapListDetail(
  db: Parameters<typeof requireFamilyList>[0],
  list: Doc<"lists">,
) {
  const categories = await db
    .query("listCategories")
    .withIndex("by_list", (q) => q.eq("listId", list._id))
    .take(200);

  const items = await db
    .query("listItems")
    .withIndex("by_list", (q) => q.eq("listId", list._id))
    .take(1000);

  return {
    id: list._id,
    name: list.name,
    kind: list.kind,
    categoryDisplayMode: list.categoryDisplayMode ?? "flat",
    showCompletedOverride: list.showCompletedOverride ?? null,
    categories: categories.map(mapCategory),
    items: items.map(mapItem),
    createdAt: creationTimeToString(list),
    updatedAt: creationTimeToString(list),
  };
}

export const getLists = query({
  args: {},
  handler: async (ctx) => {
    const family = await requireUserFamily(ctx);

    const lists = await ctx.db
      .query("lists")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))
      .take(200);

    const data = [];
    for (const list of lists) {
      const items = await ctx.db
        .query("listItems")
        .withIndex("by_list", (q) => q.eq("listId", list._id))
        .take(1000);

      data.push({
        id: list._id,
        name: list.name,
        kind: list.kind,
        totalItems: items.length,
        completedItems: items.filter((item) => item.completed).length,
      });
    }

    return { data };
  },
});

export const getListDetail = query({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    const list = await requireFamilyList(ctx.db, args.listId, family._id);

    return { data: await mapListDetail(ctx.db, list) };
  },
});

export const createList = mutation({
  args: {
    name: v.string(),
    kind: listKind,
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    const listId = await ctx.db.insert("lists", {
      familyId: family._id,
      name: args.name,
      kind: args.kind,
      categoryDisplayMode: args.kind === "general" ? "flat" : "grouped",
    });

    if (args.kind !== "general") {
      for (const [sortOrder, name] of seededCategories[args.kind].entries()) {
        await ctx.db.insert("listCategories", {
          listId,
          name,
          kind: args.kind,
          seeded: true,
          sortOrder,
        });
      }
    }

    const list = await ctx.db.get(listId);
    if (!list) throw new Error("List not found after creation");

    return { data: await mapListDetail(ctx.db, list) };
  },
});

export const updateList = mutation({
  args: {
    id: v.id("lists"),
    categoryDisplayMode: v.optional(categoryDisplayMode),
    showCompletedOverride: optionalBooleanOverride,
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    await requireFamilyList(ctx.db, args.id, family._id);

    await ctx.db.patch(args.id, {
      ...(args.categoryDisplayMode !== undefined
        ? { categoryDisplayMode: args.categoryDisplayMode }
        : {}),
      ...(args.showCompletedOverride !== undefined
        ? { showCompletedOverride: args.showCompletedOverride ?? undefined }
        : {}),
    });

    const list = await ctx.db.get(args.id);
    if (!list) throw new Error("List not found after update");

    return { data: await mapListDetail(ctx.db, list) };
  },
});

export const createListItem = mutation({
  args: {
    listId: v.id("lists"),
    text: v.string(),
    categoryId: optionalCategoryId,
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    await requireFamilyList(ctx.db, args.listId, family._id);
    await requireCategoryForList(ctx.db, args.categoryId, args.listId);

    const itemId = await ctx.db.insert("listItems", {
      listId: args.listId,
      text: args.text,
      completed: false,
      ...(args.categoryId ? { categoryId: args.categoryId } : {}),
    });

    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("List item not found after creation");

    return { data: mapItem(item) };
  },
});

export const updateListItem = mutation({
  args: {
    listId: v.id("lists"),
    itemId: v.id("listItems"),
    text: v.string(),
    completed: v.boolean(),
    categoryId: optionalCategoryId,
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    await requireFamilyList(ctx.db, args.listId, family._id);
    await requireCategoryForList(ctx.db, args.categoryId, args.listId);

    const item = await ctx.db.get(args.itemId);
    if (!item || item.listId !== args.listId) {
      throw new Error("List item not found");
    }

    await ctx.db.patch(args.itemId, {
      text: args.text,
      completed: args.completed,
      completedAt: args.completed ? new Date().toISOString() : undefined,
      categoryId: args.categoryId ?? undefined,
    });

    const updated = await ctx.db.get(args.itemId);
    if (!updated) throw new Error("List item not found after update");

    return { data: mapItem(updated) };
  },
});

export const deleteListItem = mutation({
  args: {
    listId: v.id("lists"),
    itemId: v.id("listItems"),
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    await requireFamilyList(ctx.db, args.listId, family._id);

    const item = await ctx.db.get(args.itemId);
    if (!item || item.listId !== args.listId) {
      throw new Error("List item not found");
    }

    await ctx.db.delete(args.itemId);
    return null;
  },
});

export const clearCompleted = mutation({
  args: { listId: v.id("lists") },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    await requireFamilyList(ctx.db, args.listId, family._id);

    const items = await ctx.db
      .query("listItems")
      .withIndex("by_list_and_completed", (q) =>
        q.eq("listId", args.listId).eq("completed", true),
      )
      .take(500);

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    return { data: { removedCount: items.length } };
  },
});

export const getListPreferences = query({
  args: {},
  handler: async (ctx) => {
    const family = await requireUserFamily(ctx);
    const preferences = await ctx.db
      .query("listPreferences")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))
      .first();

    return {
      data: {
        showCompletedByDefault: preferences?.showCompletedByDefault ?? true,
      },
    };
  },
});

export const updateListPreferences = mutation({
  args: { showCompletedByDefault: v.boolean() },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    const preferences = await ctx.db
      .query("listPreferences")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))
      .first();

    if (preferences) {
      await ctx.db.patch(preferences._id, args);
    } else {
      await ctx.db.insert("listPreferences", {
        familyId: family._id,
        showCompletedByDefault: args.showCompletedByDefault,
      });
    }

    return { data: args };
  },
});

async function requireCategoryForList(
  db: Parameters<typeof requireFamilyList>[0],
  categoryId: Id<"listCategories"> | null | undefined,
  listId: Id<"lists">,
) {
  if (!categoryId) return;

  const category = await db.get(categoryId);
  if (!category || category.listId !== listId) {
    throw new Error("List category not found");
  }
}
