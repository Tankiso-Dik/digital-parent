import { httpClient } from "@/api/client";
import { pb, pbCollections, pbCreatedAt, requireCurrentUserId } from "@/lib/pb";
import type {
  AddMemberRequest,
  CreateFamilyRequest,
  FamilyApiResponse,
  FamilyData,
  FamilyMember,
  FamilyMutationResponse,
  MemberMutationResponse,
  UpdateFamilyRequest,
  UpdateMemberRequest,
} from "@/lib/types";

function mapMember(record: Record<string, unknown>): FamilyMember {
  return {
    id: String(record.id),
    name: String(record.name ?? ""),
    color: record.color as FamilyMember["color"],
    avatarUrl:
      typeof record.avatarUrl === "string" && record.avatarUrl.length > 0
        ? record.avatarUrl
        : undefined,
    email:
      typeof record.email === "string" && record.email.length > 0
        ? record.email
        : undefined,
  };
}

async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const members = await pb.collection(pbCollections.familyMembers).getFullList({
    filter: pb.filter("familyId = {:familyId}", { familyId }),
    sort: "id",
  });

  return members.map(mapMember);
}

async function getCurrentFamilyRecord() {
  const owner = requireCurrentUserId();

  try {
    return await pb
      .collection(pbCollections.families)
      .getFirstListItem(pb.filter("owner = {:owner}", { owner }));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 404
    ) {
      return null;
    }
    throw error;
  }
}

async function mapFamily(record: Record<string, unknown>): Promise<FamilyData> {
  const id = String(record.id);

  return {
    id,
    name: String(record.name ?? ""),
    members: await getFamilyMembers(id),
    createdAt: pbCreatedAt(record as never),
  };
}

export const familyService = {
  /**
   * Get the current family data.
   * Returns null in data field if no family exists (triggers onboarding).
   */
  async getFamily(): Promise<FamilyApiResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.get<FamilyApiResponse>("/family");
    }

    const family = await getCurrentFamilyRecord();
    return { data: family ? await mapFamily(family) : null };
  },

  async createFamily(
    request: CreateFamilyRequest,
  ): Promise<FamilyMutationResponse> {
    if (import.meta.env.MODE === "test") {
      return {
        data: {
          id: crypto.randomUUID(),
          name: request.name,
          members: request.members.map((member) => ({
            id: crypto.randomUUID(),
            ...member,
          })),
          createdAt: new Date().toISOString(),
        },
      };
    }

    const owner = requireCurrentUserId();
    const family = await pb.collection(pbCollections.families).create({
      name: request.name,
      owner,
    });

    for (const member of request.members) {
      await pb.collection(pbCollections.familyMembers).create({
        ...member,
        familyId: family.id,
      });
    }

    return { data: await mapFamily(family) };
  },

  /**
   * Update family properties (e.g., name).
   */
  async updateFamily(
    request: UpdateFamilyRequest,
  ): Promise<FamilyMutationResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.put<FamilyMutationResponse>("/family", request);
    }

    const family = await getCurrentFamilyRecord();
    if (!family) {
      throw new Error("Family not found");
    }

    const updated = await pb
      .collection(pbCollections.families)
      .update(family.id, request);

    return { data: await mapFamily(updated) };
  },

  /**
   * Add a new member to the family.
   */
  async addMember(request: AddMemberRequest): Promise<MemberMutationResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.post<MemberMutationResponse>(
        "/family/members",
        request,
      );
    }

    const family = await getCurrentFamilyRecord();
    if (!family) {
      throw new Error("Family not found");
    }

    const member = await pb.collection(pbCollections.familyMembers).create({
      ...request,
      familyId: family.id,
    });

    return { data: mapMember(member) };
  },

  /**
   * Update an existing member.
   */
  async updateMember(
    id: string,
    request: UpdateMemberRequest,
  ): Promise<MemberMutationResponse> {
    if (import.meta.env.MODE === "test") {
      return httpClient.put<MemberMutationResponse>(
        `/family/members/${id}`,
        request,
      );
    }

    const member = await pb.collection(pbCollections.familyMembers).update(id, {
      name: request.name,
      color: request.color,
      avatarUrl: request.avatarUrl ?? "",
      email: request.email ?? "",
    });

    return { data: mapMember(member) };
  },

  /**
   * Remove a member from the family.
   */
  async removeMember(id: string): Promise<void> {
    if (import.meta.env.MODE === "test") {
      return httpClient.delete(`/family/members/${id}`);
    }

    await pb.collection(pbCollections.familyMembers).delete(id);
  },

  /**
   * Delete the entire family (reset).
   */
  async deleteFamily(): Promise<void> {
    if (import.meta.env.MODE === "test") {
      return httpClient.delete("/family");
    }

    const family = await getCurrentFamilyRecord();
    if (family) {
      await pb.collection(pbCollections.families).delete(family.id);
    }
  },
};
