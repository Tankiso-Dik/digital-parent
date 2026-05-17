import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  creationTimeToString,
  requireFamilyMember,
  requireUserFamily,
} from "./helpers";

const dueDateValidator = v.optional(v.union(v.string(), v.null()));

function mapChore(chore: {
  _id: string;
  _creationTime: number;
  title: string;
  assignedToMemberId: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
}) {
  const createdAt = creationTimeToString(chore);

  return {
    id: chore._id,
    title: chore.title,
    assignedToMemberId: chore.assignedToMemberId,
    dueDate: chore.dueDate ?? null,
    completed: chore.completed,
    completedAt: chore.completedAt ?? null,
    createdAt,
    updatedAt: chore.completedAt ?? createdAt,
  };
}

export const getChores = query({
  args: {},
  handler: async (ctx) => {
    const family = await requireUserFamily(ctx);

    const chores = await ctx.db
      .query("chores")
      .withIndex("by_family", (q) => q.eq("familyId", family._id))
      .take(500);

    return { data: chores.map(mapChore) };
  },
});

export const createChore = mutation({
  args: {
    title: v.string(),
    assignedToMemberId: v.id("familyMembers"),
    dueDate: dueDateValidator,
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    await requireFamilyMember(ctx.db, args.assignedToMemberId, family._id);

    const choreId = await ctx.db.insert("chores", {
      familyId: family._id,
      title: args.title,
      assignedToMemberId: args.assignedToMemberId,
      completed: false,
      ...(args.dueDate ? { dueDate: args.dueDate } : {}),
    });

    const chore = await ctx.db.get(choreId);
    if (!chore) throw new Error("Chore not found after creation");

    return { data: mapChore(chore) };
  },
});

export const updateChore = mutation({
  args: {
    id: v.id("chores"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    const chore = await ctx.db.get(args.id);

    if (!chore || chore.familyId !== family._id) {
      throw new Error("Chore not found");
    }

    await ctx.db.patch(args.id, {
      completed: args.completed,
      completedAt: args.completed ? new Date().toISOString() : undefined,
    });

    const updated = await ctx.db.get(args.id);
    if (!updated) throw new Error("Chore not found after update");

    return { data: mapChore(updated) };
  },
});

export const deleteChore = mutation({
  args: { id: v.id("chores") },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    const chore = await ctx.db.get(args.id);

    if (!chore || chore.familyId !== family._id) {
      throw new Error("Chore not found");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
