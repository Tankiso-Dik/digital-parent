import PocketBase from "pocketbase";

const PB_URL = process.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || "admin@digital-parent.local";
const ADMIN_PASSWORD =
  process.env.PB_ADMIN_PASSWORD || "digital-parent-admin-123";

const APP_USERNAME = process.env.PB_APP_USERNAME || "family";
const APP_PASSWORD = process.env.PB_APP_PASSWORD || "password123";
const APP_EMAIL = `${APP_USERNAME}@digital-parent.local`;

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const familyOwnerRule = "owner = @request.auth.id";
const familyChildRule = "familyId.owner = @request.auth.id";
const listChildRule = "listId.familyId.owner = @request.auth.id";

const text = (name, required = false) => ({
  name,
  type: "text",
  required,
  hidden: false,
  system: false,
  presentable: name === "name" || name === "title",
  min: 0,
  max: 0,
  pattern: "",
});

const bool = (name) => ({
  name,
  type: "bool",
  required: false,
  hidden: false,
  system: false,
  presentable: false,
});

const number = (name) => ({
  name,
  type: "number",
  required: false,
  hidden: false,
  system: false,
  presentable: false,
  min: null,
  max: null,
  onlyInt: true,
});

const email = (name) => ({
  name,
  type: "email",
  required: false,
  hidden: false,
  system: false,
  presentable: false,
  exceptDomains: null,
  onlyDomains: null,
});

const relation = (
  name,
  collectionId,
  required = true,
  cascadeDelete = false,
) => ({
  name,
  type: "relation",
  required,
  hidden: false,
  system: false,
  presentable: false,
  collectionId,
  cascadeDelete,
  minSelect: required ? 1 : 0,
  maxSelect: 1,
});

async function getCollection(name) {
  try {
    return await pb.collections.getOne(name);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function upsertCollection(definition) {
  const existing = await getCollection(definition.name);
  if (existing) {
    return pb.collections.update(existing.id, {
      ...definition,
      fields: mergeFields(existing.fields, definition.fields),
    });
  }
  return pb.collections.create(definition);
}

function mergeFields(existing, desired) {
  const desiredNames = new Set(desired.map((field) => field.name));
  const systemFields = existing.filter(
    (field) => field.system && !desiredNames.has(field.name),
  );
  return [...systemFields, ...desired];
}

async function firstOrNull(collection, filter) {
  try {
    return await pb.collection(collection).getFirstListItem(filter);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

async function main() {
  await pb
    .collection("_superusers")
    .authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);

  const users = await upsertCollection({
    name: "users",
    type: "auth",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "id = @request.auth.id",
    deleteRule: null,
    authRule: "",
    fields: [text("username", true)],
    indexes: [
      "CREATE UNIQUE INDEX `idx_users_username` ON `users` (`username`)",
    ],
    passwordAuth: {
      enabled: true,
      identityFields: ["email"],
    },
  });

  const families = await upsertCollection({
    name: "families",
    type: "base",
    listRule: familyOwnerRule,
    viewRule: familyOwnerRule,
    createRule: familyOwnerRule,
    updateRule: familyOwnerRule,
    deleteRule: familyOwnerRule,
    fields: [text("name", true), relation("owner", users.id)],
    indexes: [
      "CREATE INDEX `idx_families_owner` ON `families` (`owner`)",
    ],
  });

  const familyMembers = await upsertCollection({
    name: "familyMembers",
    type: "base",
    listRule: familyChildRule,
    viewRule: familyChildRule,
    createRule: familyChildRule,
    updateRule: familyChildRule,
    deleteRule: familyChildRule,
    fields: [
      text("name", true),
      text("color", true),
      text("avatarUrl"),
      email("email"),
      relation("familyId", families.id, true, true),
    ],
    indexes: [
      "CREATE INDEX `idx_family_members_family` ON `familyMembers` (`familyId`)",
    ],
  });

  await upsertCollection({
    name: "events",
    type: "base",
    listRule: familyChildRule,
    viewRule: familyChildRule,
    createRule: familyChildRule,
    updateRule: familyChildRule,
    deleteRule: familyChildRule,
    fields: [
      text("title", true),
      text("date", true),
      text("startTime"),
      text("endTime"),
      text("endDate"),
      relation("memberId", familyMembers.id),
      bool("isAllDay"),
      text("location"),
      text("recurrenceRule"),
      text("recurringEventId"),
      text("originalDate"),
      text("description"),
      text("source"),
      text("htmlLink"),
      relation("familyId", families.id, true, true),
    ],
    indexes: [
      "CREATE INDEX `idx_events_family_date` ON `events` (`familyId`, `date`)",
      "CREATE INDEX `idx_events_member` ON `events` (`memberId`)",
    ],
  });

  await upsertCollection({
    name: "chores",
    type: "base",
    listRule: familyChildRule,
    viewRule: familyChildRule,
    createRule: familyChildRule,
    updateRule: familyChildRule,
    deleteRule: familyChildRule,
    fields: [
      text("title", true),
      relation("assignedToMemberId", familyMembers.id),
      text("dueDate"),
      bool("completed"),
      text("completedAt"),
      relation("familyId", families.id, true, true),
    ],
    indexes: [
      "CREATE INDEX `idx_chores_family` ON `chores` (`familyId`)",
    ],
  });

  const lists = await upsertCollection({
    name: "lists",
    type: "base",
    listRule: familyChildRule,
    viewRule: familyChildRule,
    createRule: familyChildRule,
    updateRule: familyChildRule,
    deleteRule: familyChildRule,
    fields: [
      text("name", true),
      text("kind", true),
      text("categoryDisplayMode"),
      text("showCompletedOverride"),
      relation("familyId", families.id, true, true),
    ],
    indexes: [
      "CREATE INDEX `idx_lists_family` ON `lists` (`familyId`)",
    ],
  });

  const listCategories = await upsertCollection({
    name: "listCategories",
    type: "base",
    listRule: listChildRule,
    viewRule: listChildRule,
    createRule: listChildRule,
    updateRule: listChildRule,
    deleteRule: listChildRule,
    fields: [
      text("name", true),
      text("kind", true),
      bool("seeded"),
      number("sortOrder"),
      relation("listId", lists.id, true, true),
    ],
    indexes: [
      "CREATE INDEX `idx_list_categories_list` ON `listCategories` (`listId`)",
    ],
  });

  await upsertCollection({
    name: "listItems",
    type: "base",
    listRule: listChildRule,
    viewRule: listChildRule,
    createRule: listChildRule,
    updateRule: listChildRule,
    deleteRule: listChildRule,
    fields: [
      text("text", true),
      bool("completed"),
      text("completedAt"),
      relation("categoryId", listCategories.id, false),
      relation("listId", lists.id, true, true),
    ],
    indexes: [
      "CREATE INDEX `idx_list_items_list` ON `listItems` (`listId`)",
    ],
  });

  let user = await firstOrNull(
    "users",
    pb.filter("email = {:email}", { email: APP_EMAIL }),
  );
  if (!user) {
    user = await pb.collection("users").create({
      email: APP_EMAIL,
      username: APP_USERNAME,
      password: APP_PASSWORD,
      passwordConfirm: APP_PASSWORD,
      verified: true,
    });
  }

  let family = await firstOrNull(
    "families",
    pb.filter("owner = {:owner}", { owner: user.id }),
  );
  if (!family) {
    family = await pb.collection("families").create({
      name: "Digital Parent Demo",
      owner: user.id,
    });
  }

  const existingMembers = await pb.collection("familyMembers").getFullList({
    filter: pb.filter("familyId = {:familyId}", { familyId: family.id }),
  });
  if (existingMembers.length === 0) {
    await pb.collection("familyMembers").create({
      name: "Alex",
      color: "coral",
      familyId: family.id,
    });
    await pb.collection("familyMembers").create({
      name: "Sam",
      color: "teal",
      familyId: family.id,
    });
  }

  console.log(`PocketBase is configured at ${PB_URL}`);
  console.log(`Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`App login: ${APP_USERNAME} / ${APP_PASSWORD}`);
}

main().catch((error) => {
  console.error(error?.response || error);
  process.exit(1);
});
