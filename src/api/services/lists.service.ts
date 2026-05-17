import { httpClient } from "@/api/client";
import { convex } from "@/lib/convex";
import type {
  ClearCompletedApiResponse,
  CreateListItemRequest,
  CreateListRequest,
  ListDetailApiResponse,
  ListItemApiResponse,
  ListPreferencesApiResponse,
  ListSummariesApiResponse,
  UpdateListItemRequest,
  UpdateListPreferencesRequest,
  UpdateListRequest,
} from "@/lib/types";
import { api } from "../../../convex/_generated/api";

function asListDetailResponse(response: unknown): ListDetailApiResponse {
  return response as ListDetailApiResponse;
}

export const listsService = {
  getLists(): Promise<ListSummariesApiResponse> {
    if (import.meta.env.MODE !== "test") {
      return convex.query(api.lists.getLists, {});
    }

    return httpClient.get<ListSummariesApiResponse>("/lists");
  },

  getList(id: string): Promise<ListDetailApiResponse> {
    if (import.meta.env.MODE !== "test") {
      return convex
        .query(api.lists.getListDetail, { listId: id as never })
        .then(asListDetailResponse);
    }

    return httpClient.get<ListDetailApiResponse>(`/lists/${id}`);
  },

  createList(request: CreateListRequest): Promise<ListDetailApiResponse> {
    if (import.meta.env.MODE !== "test") {
      return convex
        .mutation(api.lists.createList, request)
        .then(asListDetailResponse);
    }

    return httpClient.post<ListDetailApiResponse>("/lists", request);
  },

  updateList(
    id: string,
    request: UpdateListRequest,
  ): Promise<ListDetailApiResponse> {
    if (import.meta.env.MODE !== "test") {
      return convex
        .mutation(api.lists.updateList, {
          id: id as never,
          categoryDisplayMode: request.categoryDisplayMode,
          showCompletedOverride: request.showCompletedOverride,
        })
        .then(asListDetailResponse);
    }

    return httpClient.patch<ListDetailApiResponse>(`/lists/${id}`, request);
  },

  createItem(
    listId: string,
    request: CreateListItemRequest,
  ): Promise<ListItemApiResponse> {
    if (import.meta.env.MODE !== "test") {
      return convex.mutation(api.lists.createListItem, {
        listId: listId as never,
        text: request.text,
        categoryId: (request.categoryId ?? null) as never,
      });
    }

    return httpClient.post<ListItemApiResponse>(
      `/lists/${listId}/items`,
      request,
    );
  },

  updateItem(
    listId: string,
    itemId: string,
    request: UpdateListItemRequest,
  ): Promise<ListItemApiResponse> {
    if (import.meta.env.MODE !== "test") {
      return convex.mutation(api.lists.updateListItem, {
        listId: listId as never,
        itemId: itemId as never,
        text: request.text,
        completed: request.completed,
        categoryId: (request.categoryId ?? null) as never,
      });
    }

    return httpClient.patch<ListItemApiResponse>(
      `/lists/${listId}/items/${itemId}`,
      request,
    );
  },

  deleteItem(listId: string, itemId: string): Promise<void> {
    if (import.meta.env.MODE !== "test") {
      return convex.mutation(api.lists.deleteListItem, {
        listId: listId as never,
        itemId: itemId as never,
      }) as unknown as Promise<void>;
    }

    return httpClient.delete(`/lists/${listId}/items/${itemId}`);
  },

  clearCompleted(listId: string): Promise<ClearCompletedApiResponse> {
    if (import.meta.env.MODE !== "test") {
      return convex.mutation(api.lists.clearCompleted, {
        listId: listId as never,
      });
    }

    return httpClient.post<ClearCompletedApiResponse>(
      `/lists/${listId}/clear-completed`,
    );
  },

  getPreferences(): Promise<ListPreferencesApiResponse> {
    if (import.meta.env.MODE !== "test") {
      return convex.query(api.lists.getListPreferences, {});
    }

    return httpClient.get<ListPreferencesApiResponse>("/lists/preferences");
  },

  updatePreferences(
    request: UpdateListPreferencesRequest,
  ): Promise<ListPreferencesApiResponse> {
    if (import.meta.env.MODE !== "test") {
      return convex.mutation(api.lists.updateListPreferences, request);
    }

    return httpClient.patch<ListPreferencesApiResponse>(
      "/lists/preferences",
      request,
    );
  },
};
