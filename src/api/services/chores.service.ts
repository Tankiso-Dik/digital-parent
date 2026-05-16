import { httpClient } from "@/api/client";
import { demoApi, isDemoModeActive } from "@/lib/demo-data";
import type {
  ApiResponse,
  Chore,
  CreateChoreRequest,
  UpdateChoreRequest,
} from "@/lib/types";

export const choreService = {
  async getChores(): Promise<ApiResponse<Chore[]>> {
    if (isDemoModeActive()) {
      return demoApi.getChores();
    }

    return httpClient.get<ApiResponse<Chore[]>>("/chores");
  },

  async createChore(request: CreateChoreRequest): Promise<ApiResponse<Chore>> {
    if (isDemoModeActive()) {
      return demoApi.createChore(request);
    }

    return httpClient.post<ApiResponse<Chore>>("/chores", request);
  },

  async updateChore(
    id: string,
    request: UpdateChoreRequest,
  ): Promise<ApiResponse<Chore>> {
    if (isDemoModeActive()) {
      return demoApi.updateChore(id, request);
    }

    return httpClient.patch<ApiResponse<Chore>>(`/chores/${id}`, request);
  },

  async deleteChore(id: string): Promise<void> {
    if (isDemoModeActive()) {
      demoApi.deleteChore(id);
      return;
    }

    return httpClient.delete(`/chores/${id}`);
  },
};
