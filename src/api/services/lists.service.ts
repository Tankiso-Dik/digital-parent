import { httpClient } from "@/api/client";
import { pb, pbCollections } from "@/lib/pb";
import type {
  ClearCompletedApiResponse,
  CreateListItemRequest,
  CreateListRequest,
  ListCategory,
  ListDetail,
  ListDetailApiResponse,
  ListItem,
  ListItemApiResponse,
  ListPreferencesApiResponse,
  ListSummariesApiResponse,
  ListSummary,
  UpdateListItemRequest,
  UpdateListPreferencesRequest,
  UpdateListRequest,
} from "@/lib/types";
import { familyService } from "./family.service";

function mapCategory(record: Record<string, unknown>): ListCategory {
  return {
    id: String(record.id),
    kind: record.kind as ListCategory["kind"],
    name: String(record.name ?? ""),
    seeded: Boolean(record.seeded),
    sortOrder: Number(record.sortOrder ?? 0),
  };
}

function mapItem(record: Record<string, unknown>): ListItem {
  const completedAt =
    typeof record.completedAt === "string" ? record.completedAt : "";

  return {
    id: String(record.id),
    text: String(record.text ?? ""),
    completed: Boolean(record.completed),
    completedAt: completedAt || null,
    categoryId:
      typeof record.categoryId === "string" && record.categoryId.length > 0
        ? record.categoryId
        : null,
    createdAt: String(record.created ?? ""),
    updatedAt: String(record.updated ?? ""),
  };
}

function mapShowCompletedOverride(value: unknown): boolean | null {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

function serializeShowCompletedOverride(value: boolean | null): string {
  if (value === null) return "";
  return String(value);
}

async function requireFamilyId(): Promise<string> {
  const response = await familyService.getFamily();
  if (!response.data) throw new Error("Family not found");
  return response.data.id;
}

async function mapList(record: Record<string, unknown>): Promise<ListDetail> {
  const listId = String(record.id);
  const [categories, items] = await Promise.all([
    pb.collection(pbCollections.listCategories).getFullList({
      filter: pb.filter("listId = {:listId}", { listId }),
      sort: "sortOrder,name",
    }),
    pb.collection(pbCollections.listItems).getFullList({
      filter: pb.filter("listId = {:listId}", { listId }),
      sort: "id",
    }),
  ]);

  return {
    id: listId,
    name: String(record.name ?? ""),
    kind: record.kind as ListDetail["kind"],
    categoryDisplayMode:
      (record.categoryDisplayMode as ListDetail["categoryDisplayMode"]) ??
      "grouped",
    showCompletedOverride: mapShowCompletedOverride(
      record.showCompletedOverride,
    ),
    categories: categories.map(mapCategory),
    items: items.map(mapItem),
    createdAt: String(record.created ?? ""),
    updatedAt: String(record.updated ?? ""),
  };
}

function summarize(list: ListDetail): ListSummary {
  return {
    id: list.id,
    name: list.name,
    kind: list.kind,
    totalItems: list.items.length,
    completedItems: list.items.filter((item) => item.completed).length,
  };
}

export const listsService = {
  async getLists(): Promise<ListSummariesApiResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.get<ListSummariesApiResponse>("/lists");
    }

    const familyId = await requireFamilyId();
    const records = await pb.collection(pbCollections.lists).getFullList({
      filter: pb.filter("familyId = {:familyId}", { familyId }),
      sort: "id",
    });
    const lists = await Promise.all(records.map(mapList));
    return { data: lists.map(summarize) };
  },

  async getList(id: string): Promise<ListDetailApiResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.get<ListDetailApiResponse>(`/lists/${id}`);
    }

    const record = await pb.collection(pbCollections.lists).getOne(id);
    return { data: await mapList(record) };
  },

  async createList(request: CreateListRequest): Promise<ListDetailApiResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.post<ListDetailApiResponse>("/lists", request);
    }

    const familyId = await requireFamilyId();
    const record = await pb.collection(pbCollections.lists).create({
      ...request,
      familyId,
      categoryDisplayMode: request.kind === "general" ? "flat" : "grouped",
      showCompletedOverride: "",
    });

    return { data: await mapList(record) };
  },

  async updateList(
    id: string,
    request: UpdateListRequest,
  ): Promise<ListDetailApiResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.patch<ListDetailApiResponse>(`/lists/${id}`, request);
    }

    const record = await pb.collection(pbCollections.lists).update(id, {
      categoryDisplayMode: request.categoryDisplayMode,
      showCompletedOverride: serializeShowCompletedOverride(
        request.showCompletedOverride,
      ),
    });
    return { data: await mapList(record) };
  },

  async createItem(
    listId: string,
    request: CreateListItemRequest,
  ): Promise<ListItemApiResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.post<ListItemApiResponse>(
        `/lists/${listId}/items`,
        request,
      );
    }

    const record = await pb.collection(pbCollections.listItems).create({
      ...request,
      listId,
      completed: false,
      completedAt: "",
      categoryId: request.categoryId ?? null,
    });

    return { data: mapItem(record) };
  },

  async updateItem(
    _listId: string,
    itemId: string,
    request: UpdateListItemRequest,
  ): Promise<ListItemApiResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.patch<ListItemApiResponse>(
        `/lists/${_listId}/items/${itemId}`,
        request,
      );
    }

    const record = await pb.collection(pbCollections.listItems).update(itemId, {
      ...request,
      completedAt: request.completed ? new Date().toISOString() : "",
      categoryId: request.categoryId ?? null,
    });

    return { data: mapItem(record) };
  },

  async deleteItem(_listId: string, itemId: string): Promise<void> {
    if (import.meta.env.MODE === "test") {
      return httpClient.delete(`/lists/${_listId}/items/${itemId}`);
    }

    await pb.collection(pbCollections.listItems).delete(itemId);
  },

  async clearCompleted(listId: string): Promise<ClearCompletedApiResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.post<ClearCompletedApiResponse>(
        `/lists/${listId}/clear-completed`,
      );
    }

    const records = await pb.collection(pbCollections.listItems).getFullList({
      filter: [
        pb.filter("listId = {:listId}", { listId }),
        pb.filter("completed = true", {}),
      ].join(" && "),
    });

    await Promise.all(
      records.map((record) =>
        pb.collection(pbCollections.listItems).delete(record.id),
      ),
    );

    return { data: { removedCount: records.length } };
  },

  async getPreferences(): Promise<ListPreferencesApiResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.get<ListPreferencesApiResponse>("/lists/preferences");
    }

    return { data: { showCompletedByDefault: true } };
  },

  async updatePreferences(
    request: UpdateListPreferencesRequest,
  ): Promise<ListPreferencesApiResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.patch<ListPreferencesApiResponse>(
        "/lists/preferences",
        request,
      );
    }

    return { data: request };
  },
};
