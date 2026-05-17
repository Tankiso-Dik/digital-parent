import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireFamilyMember, requireUserFamily } from "./helpers";

const nullableString = v.optional(v.union(v.string(), v.null()));

function mapEvent(event: {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  endDate?: string;
  memberId: string;
  isAllDay: boolean;
  location?: string;
  recurrenceRule?: string;
  recurringEventId?: string;
  description?: string;
  source?: string;
  htmlLink?: string;
}) {
  return {
    id: event._id,
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    endDate: event.endDate,
    memberId: event.memberId,
    isAllDay: event.isAllDay,
    location: event.location,
    recurrenceRule: event.recurrenceRule,
    recurringEventId: event.recurringEventId,
    description: event.description,
    source: event.source ?? "NATIVE",
    htmlLink: event.htmlLink,
  };
}

export const getEvents = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    memberId: v.optional(v.id("familyMembers")),
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);

    const events = await ctx.db
      .query("events")
      .withIndex("by_date", (q) =>
        q
          .eq("familyId", family._id)
          .gte("date", args.startDate)
          .lte("date", args.endDate),
      )
      .take(1000);

    return {
      data: events
        .filter((event) => !args.memberId || event.memberId === args.memberId)
        .map(mapEvent),
    };
  },
});

export const getEventById = query({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    const event = await ctx.db.get(args.id);

    if (!event || event.familyId !== family._id) {
      throw new Error("Event not found");
    }

    return { data: mapEvent(event) };
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    endDate: nullableString,
    memberId: v.id("familyMembers"),
    isAllDay: v.boolean(),
    location: nullableString,
    recurrenceRule: nullableString,
    description: nullableString,
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    await requireFamilyMember(ctx.db, args.memberId, family._id);

    const eventId = await ctx.db.insert("events", {
      familyId: family._id,
      title: args.title,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      memberId: args.memberId,
      isAllDay: args.isAllDay,
      source: "NATIVE",
      ...(args.endDate ? { endDate: args.endDate } : {}),
      ...(args.location ? { location: args.location } : {}),
      ...(args.recurrenceRule ? { recurrenceRule: args.recurrenceRule } : {}),
      ...(args.description ? { description: args.description } : {}),
    });

    const event = await ctx.db.get(eventId);
    if (!event) throw new Error("Event not found after creation");

    return { data: mapEvent(event) };
  },
});

export const updateEvent = mutation({
  args: {
    id: v.id("events"),
    title: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    endDate: nullableString,
    memberId: v.id("familyMembers"),
    isAllDay: v.boolean(),
    location: nullableString,
    recurrenceRule: nullableString,
    description: nullableString,
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    const event = await ctx.db.get(args.id);

    if (!event || event.familyId !== family._id) {
      throw new Error("Event not found");
    }

    await requireFamilyMember(ctx.db, args.memberId, family._id);

    await ctx.db.patch(args.id, {
      title: args.title,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      memberId: args.memberId,
      isAllDay: args.isAllDay,
      endDate: args.endDate ?? undefined,
      location: args.location ?? undefined,
      recurrenceRule: args.recurrenceRule ?? undefined,
      description: args.description ?? undefined,
    });

    const updated = await ctx.db.get(args.id);
    if (!updated) throw new Error("Event not found after update");

    return { data: mapEvent(updated) };
  },
});

export const deleteEvent = mutation({
  args: { id: v.id("events") },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    const event = await ctx.db.get(args.id);

    if (!event || event.familyId !== family._id) {
      throw new Error("Event not found");
    }

    await ctx.db.delete(args.id);
    return null;
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
    location: nullableString,
    description: nullableString,
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    const parent = await ctx.db.get(args.parentId);

    if (!parent || parent.familyId !== family._id) {
      throw new Error("Parent event not found");
    }

    await requireFamilyMember(ctx.db, args.memberId, family._id);

    const exceptionId = await ctx.db.insert("events", {
      familyId: family._id,
      title: args.title,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      memberId: args.memberId,
      isAllDay: args.isAllDay,
      recurringEventId: args.parentId,
      source: "NATIVE",
      ...(args.location ? { location: args.location } : {}),
      ...(args.description ? { description: args.description } : {}),
    });

    const exception = await ctx.db.get(exceptionId);
    if (!exception) throw new Error("Event not found after creation");

    return { data: mapEvent(exception) };
  },
});

export const deleteInstance = mutation({
  args: {
    parentId: v.id("events"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const family = await requireUserFamily(ctx);
    const parent = await ctx.db.get(args.parentId);

    if (!parent || parent.familyId !== family._id) {
      throw new Error("Parent event not found");
    }

    const instances = await ctx.db
      .query("events")
      .withIndex("by_recurring_event_and_date", (q) =>
        q.eq("recurringEventId", args.parentId).eq("date", args.date),
      )
      .take(100);

    for (const instance of instances) {
      if (instance.familyId === family._id) {
        await ctx.db.delete(instance._id);
      }
    }

    return null;
  },
});
