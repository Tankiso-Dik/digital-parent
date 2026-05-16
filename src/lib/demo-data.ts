import {
  AUTH_TOKEN_STORAGE_KEY,
  DEMO_DATA_STORAGE_KEY,
  DEMO_MODE_STORAGE_KEY,
  FAMILY_STORAGE_KEY,
} from "@/lib/constants";
import { formatLocalDate } from "@/lib/time-utils";
import type {
  AddMemberRequest,
  CalendarEventResponse,
  Chore,
  ClearCompletedResponse,
  CreateChoreRequest,
  CreateEventRequest,
  CreateListItemRequest,
  CreateListRequest,
  FamilyData,
  FamilyMember,
  ListCategory,
  ListDetail,
  ListItem,
  ListKind,
  ListPreferences,
  ListSummary,
  UpdateChoreRequest,
  UpdateEventRequest,
  UpdateFamilyRequest,
  UpdateListItemRequest,
  UpdateListPreferencesRequest,
  UpdateListRequest,
  UpdateMemberRequest,
} from "@/lib/types";

export const DEMO_AUTH_TOKEN = "demo-token-parentingpal";

export interface DemoData {
  family: FamilyData;
  events: CalendarEventResponse[];
  chores: Chore[];
  lists: ListDetail[];
  listPreferences: ListPreferences;
}

const DEMO_TIMESTAMP = "2026-05-16T09:00:00";

const todoCategories: ListCategory[] = [
  {
    id: "demo-category-urgent",
    kind: "to-do",
    name: "Urgent",
    seeded: true,
    sortOrder: 0,
  },
  {
    id: "demo-category-soon",
    kind: "to-do",
    name: "Soon",
    seeded: true,
    sortOrder: 1,
  },
  {
    id: "demo-category-later",
    kind: "to-do",
    name: "Later",
    seeded: true,
    sortOrder: 2,
  },
];

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(base.getDate() + days);
  return next;
}

function currentWeekDate(dayOffset: number): string {
  const today = new Date();
  const sunday = addDays(today, -today.getDay());
  return formatLocalDate(addDays(sunday, dayOffset));
}

function createDemoFamily(): FamilyData {
  return {
    id: "demo-family-thompson",
    name: "The Thompsons",
    createdAt: DEMO_TIMESTAMP,
    members: [
      {
        id: "demo-member-alice",
        name: "Alice Thompson",
        color: "coral",
        email: "alice@example.com",
      },
      {
        id: "demo-member-bob",
        name: "Bob Thompson",
        color: "teal",
        email: "bob@example.com",
      },
      { id: "demo-member-emma", name: "Emma", color: "green" },
      { id: "demo-member-jack", name: "Jack", color: "purple" },
    ],
  };
}

function createDemoData(): DemoData {
  const family = createDemoFamily();

  return {
    family,
    events: [
      {
        id: "demo-event-school-dropoff",
        title: "School drop-off",
        date: currentWeekDate(1),
        startTime: "08:00",
        endTime: "08:30",
        memberId: "demo-member-alice",
        isAllDay: false,
        location: "Maple Elementary",
      },
      {
        id: "demo-event-soccer",
        title: "Emma soccer practice",
        date: currentWeekDate(2),
        startTime: "16:30",
        endTime: "17:30",
        memberId: "demo-member-emma",
        isAllDay: false,
        location: "Community fields",
      },
      {
        id: "demo-event-dentist",
        title: "Jack dentist checkup",
        date: currentWeekDate(3),
        startTime: "10:00",
        endTime: "10:45",
        memberId: "demo-member-jack",
        isAllDay: false,
        location: "Dr. Rivera",
      },
      {
        id: "demo-event-library",
        title: "Library story hour",
        date: currentWeekDate(4),
        startTime: "15:30",
        endTime: "16:15",
        memberId: "demo-member-jack",
        isAllDay: false,
        location: "Neighborhood Library",
      },
      {
        id: "demo-event-family-dinner",
        title: "Family dinner",
        date: currentWeekDate(5),
        startTime: "18:00",
        endTime: "19:00",
        memberId: "demo-member-bob",
        isAllDay: false,
      },
      {
        id: "demo-event-swim",
        title: "Saturday swim lessons",
        date: currentWeekDate(6),
        startTime: "09:00",
        endTime: "10:00",
        memberId: "demo-member-emma",
        isAllDay: false,
        location: "Rec Center",
      },
    ],
    chores: [
      {
        id: "demo-chore-backpack",
        title: "Homework completed (+20 pts)",
        assignedToMemberId: "demo-member-emma",
        dueDate: currentWeekDate(1),
        completed: false,
        completedAt: null,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
      {
        id: "demo-chore-toys",
        title: "Brush teeth without reminders (+5 pts)",
        assignedToMemberId: "demo-member-jack",
        dueDate: currentWeekDate(2),
        completed: false,
        completedAt: null,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
      {
        id: "demo-chore-table",
        title: "Read 30 minutes (+15 pts)",
        assignedToMemberId: "demo-member-emma",
        dueDate: currentWeekDate(5),
        completed: true,
        completedAt: `${currentWeekDate(5)}T17:35:00`,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
      {
        id: "demo-chore-laundry",
        title: "No device overuse today (+25 pts)",
        assignedToMemberId: "demo-member-jack",
        dueDate: currentWeekDate(6),
        completed: false,
        completedAt: null,
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
    ],
    lists: [
      {
        id: "demo-list-weekend",
        name: "Friday Movie Pick",
        kind: "to-do",
        categoryDisplayMode: "grouped",
        showCompletedOverride: null,
        categories: todoCategories,
        items: [
          createListItem(
            "demo-item-party",
            "Finish homework 4 days this week",
            "demo-category-urgent",
          ),
          createListItem(
            "demo-item-cleats",
            "Keep screen time under the daily limit",
            "demo-category-soon",
          ),
          createListItem(
            "demo-item-books",
            "Read before bed for 20 minutes",
            "demo-category-later",
          ),
        ],
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
      {
        id: "demo-list-reading",
        name: "Reading Streak",
        kind: "general",
        categoryDisplayMode: "flat",
        showCompletedOverride: null,
        categories: [],
        items: [
          createListItem("demo-item-monday-reading", "Monday reading", null),
          createListItem("demo-item-tuesday-reading", "Tuesday reading", null),
          createListItem("demo-item-reward", "Unlock extra story choice", null),
        ],
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
    ],
    listPreferences: { showCompletedByDefault: true },
  };
}

function createListItem(
  id: string,
  text: string,
  categoryId: string | null,
): ListItem {
  return {
    id,
    text,
    completed: false,
    completedAt: null,
    categoryId,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  };
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function writeFamilyToStorage(family: FamilyData | null): void {
  if (family === null) {
    localStorage.removeItem(FAMILY_STORAGE_KEY);
    return;
  }

  localStorage.setItem(
    FAMILY_STORAGE_KEY,
    JSON.stringify({
      state: { family, _hasHydrated: true },
      version: 0,
    }),
  );
}

function readDemoData(): DemoData {
  const stored = localStorage.getItem(DEMO_DATA_STORAGE_KEY);
  if (!stored) {
    const seeded = createDemoData();
    writeDemoData(seeded);
    return seeded;
  }

  return JSON.parse(stored) as DemoData;
}

function writeDemoData(data: DemoData): void {
  localStorage.setItem(DEMO_DATA_STORAGE_KEY, JSON.stringify(data));
  writeFamilyToStorage(data.family);
}

function categoriesForKind(kind: ListKind): ListCategory[] {
  if (kind === "to-do") return todoCategories;
  return [];
}

function toListSummary(list: ListDetail): ListSummary {
  return {
    id: list.id,
    name: list.name,
    kind: list.kind,
    totalItems: list.items.length,
    completedItems: list.items.filter((item) => item.completed).length,
  };
}

export function isDemoModeActive(): boolean {
  if (typeof window === "undefined") return false;

  return (
    localStorage.getItem(DEMO_MODE_STORAGE_KEY) === "true" ||
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) === DEMO_AUTH_TOKEN
  );
}

export function seedDemoSession(): DemoData {
  const data = createDemoData();
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, DEMO_AUTH_TOKEN);
  localStorage.setItem(DEMO_MODE_STORAGE_KEY, "true");
  writeDemoData(data);
  return data;
}

export function clearDemoSession(): void {
  localStorage.removeItem(DEMO_MODE_STORAGE_KEY);
  localStorage.removeItem(DEMO_DATA_STORAGE_KEY);
}

export const demoApi = {
  getFamily() {
    return { data: readDemoData().family };
  },

  updateFamily(request: UpdateFamilyRequest) {
    const data = readDemoData();
    data.family = { ...data.family, name: request.name };
    writeDemoData(data);
    return { data: data.family, message: "Family updated successfully" };
  },

  addMember(request: AddMemberRequest) {
    const data = readDemoData();
    const member: FamilyMember = {
      id: createId("demo-member"),
      ...request,
    };
    data.family = { ...data.family, members: [...data.family.members, member] };
    writeDemoData(data);
    return { data: member, message: "Member added successfully" };
  },

  updateMember(id: string, request: UpdateMemberRequest) {
    const data = readDemoData();
    let updatedMember: FamilyMember | null = null;
    data.family = {
      ...data.family,
      members: data.family.members.map((member) => {
        if (member.id !== id) return member;
        updatedMember = {
          ...member,
          name: request.name,
          color: request.color,
          avatarUrl:
            request.avatarUrl !== undefined
              ? (request.avatarUrl ?? undefined)
              : member.avatarUrl,
          email: request.email !== undefined ? request.email : member.email,
        };
        return updatedMember;
      }),
    };
    writeDemoData(data);
    return {
      data: updatedMember ?? data.family.members[0],
      message: "Member updated successfully",
    };
  },

  removeMember(id: string) {
    const data = readDemoData();
    data.family = {
      ...data.family,
      members: data.family.members.filter((member) => member.id !== id),
    };
    data.events = data.events.filter((event) => event.memberId !== id);
    data.chores = data.chores.filter(
      (chore) => chore.assignedToMemberId !== id,
    );
    writeDemoData(data);
  },

  deleteFamily() {
    clearDemoSession();
    writeFamilyToStorage(null);
  },

  getEvents() {
    return { data: readDemoData().events };
  },

  getEventById(id: string) {
    const event = readDemoData().events.find((item) => item.id === id);
    return { data: event ?? readDemoData().events[0] };
  },

  createEvent(request: CreateEventRequest) {
    const data = readDemoData();
    const event: CalendarEventResponse = {
      id: createId("demo-event"),
      title: request.title,
      startTime: request.startTime,
      endTime: request.endTime,
      date: request.date,
      endDate: request.endDate ?? undefined,
      memberId: request.memberId,
      isAllDay: request.isAllDay ?? false,
      location: request.location,
      recurrenceRule: request.recurrenceRule ?? undefined,
      description: request.description,
    };
    data.events = [...data.events, event];
    writeDemoData(data);
    return { data: event, message: "Event created successfully" };
  },

  updateEvent(id: string, request: UpdateEventRequest) {
    const data = readDemoData();
    const event: CalendarEventResponse = {
      id,
      title: request.title,
      startTime: request.startTime,
      endTime: request.endTime,
      date: request.date,
      endDate: request.endDate ?? undefined,
      memberId: request.memberId,
      isAllDay: request.isAllDay ?? false,
      location: request.location,
      recurrenceRule: request.recurrenceRule ?? undefined,
      description: request.description,
    };
    data.events = data.events.map((item) => (item.id === id ? event : item));
    writeDemoData(data);
    return { data: event, message: "Event updated successfully" };
  },

  deleteEvent(id: string) {
    const data = readDemoData();
    data.events = data.events.filter((event) => event.id !== id);
    writeDemoData(data);
  },

  getChores() {
    return { data: readDemoData().chores };
  },

  createChore(request: CreateChoreRequest) {
    const data = readDemoData();
    const now = new Date().toISOString();
    const chore: Chore = {
      id: createId("demo-chore"),
      title: request.title,
      assignedToMemberId: request.assignedToMemberId,
      dueDate: request.dueDate ?? null,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    data.chores = [...data.chores, chore];
    writeDemoData(data);
    return { data: chore, message: "Chore created successfully" };
  },

  updateChore(id: string, request: UpdateChoreRequest) {
    const data = readDemoData();
    const now = new Date().toISOString();
    let updatedChore: Chore | null = null;
    data.chores = data.chores.map((chore) => {
      if (chore.id !== id) return chore;
      updatedChore = {
        ...chore,
        completed: request.completed,
        completedAt: request.completed ? (chore.completedAt ?? now) : null,
        updatedAt: now,
      };
      return updatedChore;
    });
    writeDemoData(data);
    return {
      data: updatedChore ?? data.chores[0],
      message: "Chore updated successfully",
    };
  },

  deleteChore(id: string) {
    const data = readDemoData();
    data.chores = data.chores.filter((chore) => chore.id !== id);
    writeDemoData(data);
  },

  getLists() {
    return { data: readDemoData().lists.map(toListSummary) };
  },

  getList(id: string) {
    const list = readDemoData().lists.find((item) => item.id === id);
    return { data: list ?? readDemoData().lists[0] };
  },

  createList(request: CreateListRequest) {
    const data = readDemoData();
    const now = new Date().toISOString();
    const list: ListDetail = {
      id: createId("demo-list"),
      name: request.name.trim(),
      kind: request.kind,
      categoryDisplayMode: request.kind === "general" ? "flat" : "grouped",
      showCompletedOverride: null,
      categories: categoriesForKind(request.kind),
      items: [],
      createdAt: now,
      updatedAt: now,
    };
    data.lists = [list, ...data.lists];
    writeDemoData(data);
    return { data: list, message: "List created successfully" };
  },

  updateList(id: string, request: UpdateListRequest) {
    const data = readDemoData();
    const now = new Date().toISOString();
    let updatedList: ListDetail | null = null;
    data.lists = data.lists.map((list) => {
      if (list.id !== id) return list;
      updatedList = {
        ...list,
        categoryDisplayMode: request.categoryDisplayMode,
        showCompletedOverride: request.showCompletedOverride,
        updatedAt: now,
      };
      return updatedList;
    });
    writeDemoData(data);
    return {
      data: updatedList ?? data.lists[0],
      message: "List updated successfully",
    };
  },

  createListItem(listId: string, request: CreateListItemRequest) {
    const data = readDemoData();
    const now = new Date().toISOString();
    const item: ListItem = {
      id: createId("demo-item"),
      text: request.text.trim(),
      completed: false,
      completedAt: null,
      categoryId: request.categoryId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    data.lists = data.lists.map((list) =>
      list.id === listId
        ? { ...list, items: [...list.items, item], updatedAt: now }
        : list,
    );
    writeDemoData(data);
    return { data: item, message: "List item created successfully" };
  },

  updateListItem(
    listId: string,
    itemId: string,
    request: UpdateListItemRequest,
  ) {
    const data = readDemoData();
    const now = new Date().toISOString();
    let updatedItem: ListItem | null = null;
    data.lists = data.lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            items: list.items.map((item) => {
              if (item.id !== itemId) return item;
              updatedItem = {
                ...item,
                text: request.text.trim(),
                completed: request.completed,
                completedAt: request.completed
                  ? (item.completedAt ?? now)
                  : null,
                categoryId: request.categoryId ?? null,
                updatedAt: now,
              };
              return updatedItem;
            }),
            updatedAt: now,
          }
        : list,
    );
    writeDemoData(data);
    return { data: updatedItem ?? readDemoData().lists[0].items[0] };
  },

  deleteListItem(listId: string, itemId: string) {
    const data = readDemoData();
    const now = new Date().toISOString();
    data.lists = data.lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            items: list.items.filter((item) => item.id !== itemId),
            updatedAt: now,
          }
        : list,
    );
    writeDemoData(data);
  },

  clearCompleted(listId: string) {
    const data = readDemoData();
    let removedCount = 0;
    data.lists = data.lists.map((list) => {
      if (list.id !== listId) return list;
      removedCount = list.items.filter((item) => item.completed).length;
      return {
        ...list,
        items: list.items.filter((item) => !item.completed),
        updatedAt: new Date().toISOString(),
      };
    });
    writeDemoData(data);
    return {
      data: { removedCount } satisfies ClearCompletedResponse,
      message: "Completed items removed successfully",
    };
  },

  getPreferences() {
    return { data: readDemoData().listPreferences };
  },

  updatePreferences(request: UpdateListPreferencesRequest) {
    const data = readDemoData();
    data.listPreferences = request;
    writeDemoData(data);
    return {
      data: data.listPreferences,
      message: "List preferences updated successfully",
    };
  },
};
