import { httpClient } from "@/api/client";
import { convex } from "@/lib/convex";
import type {
  AddMemberRequest,
  FamilyApiResponse,
  FamilyData,
  FamilyMutationResponse,
  MemberMutationResponse,
  UpdateFamilyRequest,
  UpdateMemberRequest,
} from "@/lib/types";
import { api } from "../../../convex/_generated/api";

export const familyService = {
  /**
   * Get the current family data.
   * Returns null in data field if no family exists (triggers onboarding).
   */
  async getFamily(): Promise<FamilyApiResponse> {
    if (import.meta.env.MODE !== "test") {
      const response = await convex.query(api.family.getFamily, {});
      return { data: response.data as FamilyData | null };
    }

    return httpClient.get<FamilyApiResponse>("/family");
  },

  /**
   * Update family properties (e.g., name).
   */
  async updateFamily(
    request: UpdateFamilyRequest,
  ): Promise<FamilyMutationResponse> {
    if (import.meta.env.MODE !== "test") {
      const response = await convex.mutation(api.family.updateFamily, request);
      return { data: response.data as FamilyData };
    }

    return httpClient.put<FamilyMutationResponse>("/family", request);
  },

  /**
   * Add a new member to the family.
   */
  async addMember(request: AddMemberRequest): Promise<MemberMutationResponse> {
    if (import.meta.env.MODE !== "test") {
      return convex.mutation(api.family.addMember, request);
    }

    return httpClient.post<MemberMutationResponse>("/family/members", request);
  },

  /**
   * Update an existing member.
   */
  async updateMember(
    id: string,
    request: UpdateMemberRequest,
  ): Promise<MemberMutationResponse> {
    if (import.meta.env.MODE !== "test") {
      return convex.mutation(api.family.updateMember, {
        id: id as never,
        name: request.name,
        color: request.color,
        avatarUrl: request.avatarUrl ?? undefined,
        email: request.email,
      });
    }

    return httpClient.put<MemberMutationResponse>(
      `/family/members/${id}`,
      request,
    );
  },

  /**
   * Remove a member from the family.
   */
  async removeMember(id: string): Promise<void> {
    if (import.meta.env.MODE !== "test") {
      await convex.mutation(api.family.removeMember, { id: id as never });
      return;
    }

    return httpClient.delete(`/family/members/${id}`);
  },

  /**
   * Delete the entire family (reset).
   */
  async deleteFamily(): Promise<void> {
    if (import.meta.env.MODE !== "test") {
      await convex.mutation(api.family.deleteFamily, {});
      return;
    }

    return httpClient.delete("/family");
  },
};
