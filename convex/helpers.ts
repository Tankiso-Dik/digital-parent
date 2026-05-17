import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { DatabaseReader, QueryCtx } from "./_generated/server";

export async function requireAuthUserId(ctx: { auth: QueryCtx["auth"] }) {
  const userId = await getAuthUserId(ctx);

  if (!userId) {
    throw new Error("Not authenticated");
  }

  return userId;
}

export async function getUserFamily(
  ctx: {
    auth: QueryCtx["auth"];
  } & {
    db: DatabaseReader;
  },
) {
  const userId = await requireAuthUserId(ctx);

  return await ctx.db
    .query("families")
    .withIndex("by_owner", (q) => q.eq("owner", userId))
    .unique();
}

export async function requireUserFamily(
  ctx: {
    auth: QueryCtx["auth"];
  } & {
    db: DatabaseReader;
  },
) {
  const family = await getUserFamily(ctx);

  if (!family) {
    throw new Error("No family found");
  }

  return family;
}

export async function requireFamilyMember(
  db: DatabaseReader,
  memberId: Id<"familyMembers">,
  familyId: Id<"families">,
) {
  const member = await db.get(memberId);

  if (!member || member.familyId !== familyId) {
    throw new Error("Family member not found");
  }

  return member;
}

export async function requireFamilyList(
  db: DatabaseReader,
  listId: Id<"lists">,
  familyId: Id<"families">,
) {
  const list = await db.get(listId);

  if (!list || list.familyId !== familyId) {
    throw new Error("List not found");
  }

  return list;
}

export function creationTimeToString(
  doc: Pick<Doc<"families">, "_creationTime">,
) {
  return new Date(doc._creationTime).toISOString();
}
