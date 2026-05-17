import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  creationTimeToString,
  getUserFamily,
  requireAuthUserId,
  requireFamilyMember,
  requireUserFamily,
} from "./helpers";

const familyColor = v.union(
  v.literal("coral"),
  v.literal("teal"),
  v.literal("green"),
  v.literal("purple"),
  v.literal("yellow"),
  v.literal("pink"),
  v.literal("orange"),
);

export const getFamily = query({
  args: {},
  handler: async (ctx) => {
    const family = await getUserFamily(ctx);

    if (!family) {
      return { data: null };
    }

    const members = await ctx.db
      .query("familyMembers")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))
      .collect();

    return {
      data: {
        id: family._id,
        name: family.name,
        members: members.map((member) => ({
          id: member._id,
          name: member.name,
          color: member.color,
          avatarUrl: member.avatarUrl,
          email: member.email,
        })),
        createdAt: creationTimeToString(family),
      },
    };
  },
});

export const createFamily = mutation({
  args: {
    name: v.string(),
    members: v.array(
      v.object({
        name: v.string(),
        color: familyColor,
        avatarUrl: v.optional(v.string()),
        email: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);

    const existing = await ctx.db
      .query("families")
      .withIndex("by_owner", (q) => q.eq("owner", userId))
      .unique();

    if (existing) {
      throw new Error("Family already exists");
    }

    const familyId = await ctx.db.insert("families", {
      name: args.name,
      owner: userId,
    });

    const members = [];
    for (const member of args.members) {
      const memberId = await ctx.db.insert("familyMembers", {
        familyId,
        name: member.name,
        color: member.color,
        ...(member.avatarUrl ? { avatarUrl: member.avatarUrl } : {}),
        ...(member.email ? { email: member.email } : {}),
      });

      members.push({
        id: memberId,
        name: member.name,
        color: member.color,
        avatarUrl: member.avatarUrl,
        email: member.email,
      });
    }

    await ctx.db.insert("listPreferences", {
      familyId,
      showCompletedByDefault: true,
    });

    const family = await ctx.db.get(familyId);
    if (!family) throw new Error("Family not found after creation");

    return {
      data: {
        id: familyId,
        name: args.name,
        members,
        createdAt: creationTimeToString(family),
      },
    };
  },
});

export const updateFamily = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    await ctx.db.patch(family._id, { name: args.name });

    const members = await ctx.db
      .query("familyMembers")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))
      .collect();

    return {
      data: {
        id: family._id,
        name: args.name,
        members: members.map((member) => ({
          id: member._id,
          name: member.name,
          color: member.color,
          avatarUrl: member.avatarUrl,
          email: member.email,
        })),
        createdAt: creationTimeToString(family),
      },
    };
  },
});

export const addMember = mutation({
  args: {
    name: v.string(),
    color: familyColor,
    avatarUrl: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);

    const memberId = await ctx.db.insert("familyMembers", {
      familyId: family._id,
      name: args.name,
      color: args.color,
      ...(args.avatarUrl ? { avatarUrl: args.avatarUrl } : {}),
      ...(args.email ? { email: args.email } : {}),
    });

    return {
      data: {
        id: memberId,
        name: args.name,
        color: args.color,
        avatarUrl: args.avatarUrl,
        email: args.email,
      },
    };
  },
});

export const updateMember = mutation({
  args: {
    id: v.id("familyMembers"),
    name: v.string(),
    color: familyColor,
    avatarUrl: v.optional(v.union(v.string(), v.null())),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    await requireFamilyMember(ctx.db, args.id, family._id);

    await ctx.db.patch(args.id, {
      name: args.name,
      color: args.color,
      ...(args.avatarUrl === null
        ? { avatarUrl: undefined }
        : args.avatarUrl !== undefined
          ? { avatarUrl: args.avatarUrl }
          : {}),
      ...(args.email !== undefined ? { email: args.email } : {}),
    });

    return {
      data: {
        id: args.id,
        name: args.name,
        color: args.color,
        avatarUrl: args.avatarUrl ?? undefined,
        email: args.email,
      },
    };
  },
});

export const removeMember = mutation({
  args: { id: v.id("familyMembers") },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    await requireFamilyMember(ctx.db, args.id, family._id);
    await ctx.db.delete(args.id);

    return null;
  },
});

export const deleteFamily = mutation({
  args: {},
  handler: async (ctx) => {
    const family = await getUserFamily(ctx);

    if (!family) {
      return null;
    }

    for await (const member of ctx.db
      .query("familyMembers")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))) {
      await ctx.db.delete(member._id);
    }

    for await (const event of ctx.db
      .query("events")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))) {
      await ctx.db.delete(event._id);
    }

    for await (const chore of ctx.db
      .query("chores")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))) {
      await ctx.db.delete(chore._id);
    }

    for await (const list of ctx.db
      .query("lists")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))) {
      for await (const item of ctx.db
        .query("listItems")
        .withIndex("by_list", (q) => q.eq("listId", list._id))) {
        await ctx.db.delete(item._id);
      }

      for await (const category of ctx.db
        .query("listCategories")
        .withIndex("by_list", (q) => q.eq("listId", list._id))) {
        await ctx.db.delete(category._id);
      }

      await ctx.db.delete(list._id);
    }

    for await (const preferences of ctx.db
      .query("listPreferences")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))) {
      await ctx.db.delete(preferences._id);
    }

    await ctx.db.delete(family._id);
    return null;
  },
});
