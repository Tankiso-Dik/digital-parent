import { httpClient } from "@/api/client";
import { demoApi, isDemoModeActive } from "@/lib/demo-data";
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

export const listsService = {
  getLists(): Promise<ListSummariesApiResponse> {
    if (isDemoModeActive()) {
      return Promise.resolve(demoApi.getLists());
    }

    return httpClient.get<ListSummariesApiResponse>("/lists");
  },

  getList(id: string): Promise<ListDetailApiResponse> {
    if (isDemoModeActive()) {
      return Promise.resolve(demoApi.getList(id));
    }

    return httpClient.get<ListDetailApiResponse>(`/lists/${id}`);
  },

  createList(request: CreateListRequest): Promise<ListDetailApiResponse> {
    if (isDemoModeActive()) {
      return Promise.resolve(demoApi.createList(request));
    }

    return httpClient.post<ListDetailApiResponse>("/lists", request);
  },

  updateList(
    id: string,
    request: UpdateListRequest,
  ): Promise<ListDetailApiResponse> {
    if (isDemoModeActive()) {
      return Promise.resolve(demoApi.updateList(id, request));
    }

    return httpClient.patch<ListDetailApiResponse>(`/lists/${id}`, request);
  },

  createItem(
    listId: string,
    request: CreateListItemRequest,
  ): Promise<ListItemApiResponse> {
    if (isDemoModeActive()) {
      return Promise.resolve(demoApi.createListItem(listId, request));
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
    if (isDemoModeActive()) {
      return Promise.resolve(demoApi.updateListItem(listId, itemId, request));
    }

    return httpClient.patch<ListItemApiResponse>(
      `/lists/${listId}/items/${itemId}`,
      request,
    );
  },

  deleteItem(listId: string, itemId: string): Promise<void> {
    if (isDemoModeActive()) {
      demoApi.deleteListItem(listId, itemId);
      return Promise.resolve();
    }

    return httpClient.delete(`/lists/${listId}/items/${itemId}`);
  },

  clearCompleted(listId: string): Promise<ClearCompletedApiResponse> {
    if (isDemoModeActive()) {
      return Promise.resolve(demoApi.clearCompleted(listId));
    }

    return httpClient.post<ClearCompletedApiResponse>(
      `/lists/${listId}/clear-completed`,
    );
  },

  getPreferences(): Promise<ListPreferencesApiResponse> {
    if (isDemoModeActive()) {
      return Promise.resolve(demoApi.getPreferences());
    }

    return httpClient.get<ListPreferencesApiResponse>("/lists/preferences");
  },

  updatePreferences(
    request: UpdateListPreferencesRequest,
  ): Promise<ListPreferencesApiResponse> {
    if (isDemoModeActive()) {
      return Promise.resolve(demoApi.updatePreferences(request));
    }

    return httpClient.patch<ListPreferencesApiResponse>(
      "/lists/preferences",
      request,
    );
  },
};
