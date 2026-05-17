import { httpClient } from "@/api/client";
import { convex } from "@/lib/convex";
import type {
  ApiResponse,
  Chore,
  CreateChoreRequest,
  UpdateChoreRequest,
} from "@/lib/types";
import { api } from "../../../convex/_generated/api";

export const choreService = {
  async getChores(): Promise<ApiResponse<Chore[]>> {
    if (import.meta.env.MODE !== "test") {
      return convex.query(api.chores.getChores, {});
    }

    return httpClient.get<ApiResponse<Chore[]>>("/chores");
  },

  async createChore(request: CreateChoreRequest): Promise<ApiResponse<Chore>> {
    if (import.meta.env.MODE !== "test") {
      return convex.mutation(api.chores.createChore, {
        title: request.title,
        assignedToMemberId: request.assignedToMemberId as never,
        dueDate: request.dueDate ?? null,
      });
    }

    return httpClient.post<ApiResponse<Chore>>("/chores", request);
  },

  async updateChore(
    id: string,
    request: UpdateChoreRequest,
  ): Promise<ApiResponse<Chore>> {
    if (import.meta.env.MODE !== "test") {
      return convex.mutation(api.chores.updateChore, {
        id: id as never,
        completed: request.completed,
      });
    }

    return httpClient.patch<ApiResponse<Chore>>(`/chores/${id}`, request);
  },

  async deleteChore(id: string): Promise<void> {
    if (import.meta.env.MODE !== "test") {
      await convex.mutation(api.chores.deleteChore, { id: id as never });
      return;
    }

    return httpClient.delete(`/chores/${id}`);
  },
};
