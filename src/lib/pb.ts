import PocketBase, { type RecordModel } from "pocketbase";

const pocketBaseUrl =
  import.meta.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090";

export const pb = new PocketBase(pocketBaseUrl);
pb.autoCancellation(false);

export const pbCollections = {
  users: "users",
  families: "families",
  familyMembers: "familyMembers",
  events: "events",
  chores: "chores",
  lists: "lists",
  listCategories: "listCategories",
  listItems: "listItems",
} as const;

export function getCurrentUserId(): string | null {
  return pb.authStore.record?.id ?? null;
}

export function requireCurrentUserId(): string {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function pbCreatedAt(record: RecordModel): string {
  return record.created || new Date().toISOString();
}
