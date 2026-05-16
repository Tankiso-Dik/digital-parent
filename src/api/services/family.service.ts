import { httpClient } from "@/api/client";
import { demoApi, isDemoModeActive } from "@/lib/demo-data";
import type {
  AddMemberRequest,
  FamilyApiResponse,
  FamilyMutationResponse,
  MemberMutationResponse,
  UpdateFamilyRequest,
  UpdateMemberRequest,
} from "@/lib/types";

export const familyService = {
  /**
   * Get the current family data.
   * Returns null in data field if no family exists (triggers onboarding).
   */
  async getFamily(): Promise<FamilyApiResponse> {
    if (isDemoModeActive()) {
      return demoApi.getFamily();
    }

    return httpClient.get<FamilyApiResponse>("/family");
  },

  /**
   * Update family properties (e.g., name).
   */
  async updateFamily(
    request: UpdateFamilyRequest,
  ): Promise<FamilyMutationResponse> {
    if (isDemoModeActive()) {
      return demoApi.updateFamily(request);
    }

    return httpClient.put<FamilyMutationResponse>("/family", request);
  },

  /**
   * Add a new member to the family.
   */
  async addMember(request: AddMemberRequest): Promise<MemberMutationResponse> {
    if (isDemoModeActive()) {
      return demoApi.addMember(request);
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
    if (isDemoModeActive()) {
      return demoApi.updateMember(id, request);
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
    if (isDemoModeActive()) {
      demoApi.removeMember(id);
      return;
    }

    return httpClient.delete(`/family/members/${id}`);
  },

  /**
   * Delete the entire family (reset).
   */
  async deleteFamily(): Promise<void> {
    if (isDemoModeActive()) {
      demoApi.deleteFamily();
      return;
    }

    return httpClient.delete("/family");
  },
};
