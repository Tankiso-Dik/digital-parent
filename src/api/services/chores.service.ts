import { httpClient } from "@/api/client";
import { pb, pbCollections } from "@/lib/pb";
import type {
  ApiResponse,
  Chore,
  CreateChoreRequest,
  UpdateChoreRequest,
} from "@/lib/types";
import { familyService } from "./family.service";

function mapRecordToChore(record: Record<string, unknown>): Chore {
  const dueDate = typeof record.dueDate === "string" ? record.dueDate : "";
  const completedAt =
    typeof record.completedAt === "string" ? record.completedAt : "";

  return {
    id: String(record.id),
    title: String(record.title ?? ""),
    assignedToMemberId: String(record.assignedToMemberId ?? ""),
    dueDate: dueDate || null,
    completed: Boolean(record.completed),
    completedAt: completedAt || null,
    createdAt: String(record.created ?? ""),
    updatedAt: String(record.updated ?? ""),
  };
}

async function requireFamilyId(): Promise<string> {
  const response = await familyService.getFamily();
  if (!response.data) throw new Error("Family not found");
  return response.data.id;
}

export const choreService = {
  async getChores(): Promise<ApiResponse<Chore[]>> {
    if (import.meta.env.MODE === "test") {
      return httpClient.get<ApiResponse<Chore[]>>("/chores");
    }

    const familyId = await requireFamilyId();
    const records = await pb.collection(pbCollections.chores).getFullList({
      filter: pb.filter("familyId = {:familyId}", { familyId }),
      sort: "dueDate,id",
    });
    return { data: records.map(mapRecordToChore) };
  },

  async createChore(request: CreateChoreRequest): Promise<ApiResponse<Chore>> {
    if (import.meta.env.MODE === "test") {
      return httpClient.post<ApiResponse<Chore>>("/chores", request);
    }

    const familyId = await requireFamilyId();
    const record = await pb.collection(pbCollections.chores).create({
      ...request,
      familyId,
      dueDate: request.dueDate ?? "",
      completed: false,
      completedAt: "",
    });
    return { data: mapRecordToChore(record) };
  },

  async updateChore(
    id: string,
    request: UpdateChoreRequest,
  ): Promise<ApiResponse<Chore>> {
    if (import.meta.env.MODE === "test") {
      return httpClient.patch<ApiResponse<Chore>>(`/chores/${id}`, request);
    }

    const record = await pb.collection(pbCollections.chores).update(id, {
      completed: request.completed,
      completedAt: request.completed ? new Date().toISOString() : "",
    });
    return { data: mapRecordToChore(record) };
  },

  async deleteChore(id: string): Promise<void> {
    if (import.meta.env.MODE === "test") {
      return httpClient.delete(`/chores/${id}`);
    }

    await pb.collection(pbCollections.chores).delete(id);
  },
};
