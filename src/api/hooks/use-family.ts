import type { UseQueryOptions } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ApiException } from "@/api/client";
import { familyService } from "@/api/services";
import type {
  AddMemberRequest,
  CreateFamilyRequest,
  FamilyApiResponse,
  FamilyColor,
  FamilyData,
  FamilyMember,
  FamilyMutationResponse,
  MemberMutationResponse,
  UpdateFamilyRequest,
  UpdateMemberRequest,
} from "@/lib/types";
import { familyColors } from "@/lib/types";
import { usePbAuth } from "@/providers/pb-provider";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const familyKeys = {
  all: ["family"] as const,
  family: () => [...familyKeys.all, "data"] as const,
};

/**
 * Fetch family data from PocketBase through the service layer.
 */
export function useFamily(
  options?: Omit<
    UseQueryOptions<FamilyApiResponse, ApiException>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: familyKeys.family(),
    queryFn: familyService.getFamily,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// ============================================================================
// Derived Selectors (read from query cache)
// ============================================================================

/**
 * Get family data (null if not initialized).
 */
export function useFamilyData(): FamilyData | null {
  const { data } = useFamily();
  return data?.data ?? null;
}

/**
 * Get all family members.
 */
export function useFamilyMembers(): FamilyMember[] {
  const { data } = useFamily();
  return data?.data?.members ?? [];
}

/**
 * Get family name.
 */
export function useFamilyName(): string {
  const { data } = useFamily();
  return data?.data?.name ?? "";
}

/**
 * Check if setup is complete.
 * Derived: true when family data exists and has at least one member.
 *
 * Auth guard: Unlike other derived selectors (useFamilyName, useFamilyMembers, etc.)
 * which are only rendered inside authenticated routes, this hook is called at the
 * top-level routing layer (App.tsx) before the auth guard. Without the `enabled`
 * check, useFamily() would fire GET /family on every page load — returning 401
 * for unauthenticated users and triggering an infinite reload loop.
 */
export function useSetupComplete(): boolean {
  const { isAuthenticated } = usePbAuth();
  const { data, isFetched } = useFamily({ enabled: isAuthenticated });
  if (!isFetched) return false;
  const family = data?.data;
  return family != null && family.members.length > 0;
}

export function useSetupStatus(): {
  isLoading: boolean;
  isComplete: boolean;
  isError: boolean;
} {
  const { isAuthenticated } = usePbAuth();
  const { data, isError, isLoading, isFetching } = useFamily({
    enabled: isAuthenticated,
  });
  const family = data?.data;

  return {
    isLoading: isAuthenticated && (isLoading || (isFetching && !data)),
    isComplete: family != null && family.members.length > 0,
    isError,
  };
}

/**
 * Check if family data is loading (for initial load states).
 */
export function useFamilyLoading(): boolean {
  const { isLoading, isFetching, data } = useFamily();
  // Loading if we don't have data and are fetching
  return isLoading || (isFetching && !data);
}

/**
 * Get a family member by ID.
 */
export function useFamilyMemberById(id: string): FamilyMember | undefined {
  const members = useFamilyMembers();
  return members.find((m) => m.id === id);
}

/**
 * Get the family member map for O(1) lookups.
 * Memoized to prevent creating new Map on every render.
 */
export function useFamilyMemberMap(): Map<string, FamilyMember> {
  const members = useFamilyMembers();
  return useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
}

/**
 * Get unused colors (colors not assigned to any member).
 * Memoized to prevent creating new array on every render.
 */
export function useUnusedColors(): FamilyColor[] {
  const members = useFamilyMembers();
  return useMemo(() => {
    const usedColors = new Set(members.map((m) => m.color));
    return familyColors.filter((c) => !usedColors.has(c));
  }, [members]);
}

// ============================================================================
// Mutations
// ============================================================================

interface UpdateFamilyCallbacks {
  onSuccess?: (data: FamilyMutationResponse) => void;
  onError?: (error: ApiException) => void;
}

/**
 * Update family properties (e.g., name).
 */
export function useUpdateFamily(callbacks?: UpdateFamilyCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateFamilyRequest) =>
      familyService.updateFamily(request),
    // Optimistic update
    onMutate: async (request) => {
      await queryClient.cancelQueries({ queryKey: familyKeys.family() });

      const previousData = queryClient.getQueryData<FamilyApiResponse>(
        familyKeys.family(),
      );

      if (previousData?.data) {
        const optimisticFamily: FamilyData = {
          ...previousData.data,
          name: request.name,
        };
        queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
          ...previousData,
          data: optimisticFamily,
        });
      }

      return { previousData };
    },
    onError: (error: ApiException, _request, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(familyKeys.family(), context.previousData);
      }
      callbacks?.onError?.(error);
    },
    onSuccess: (response) => {
      // Update with server response
      queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
        data: response.data,
      });
      callbacks?.onSuccess?.(response);
    },
  });
}

interface CreateFamilyCallbacks {
  onSuccess?: (data: FamilyMutationResponse) => void;
  onError?: (error: ApiException) => void;
}

/**
 * Create a new family (typically called after auth registration).
 */
export function useCreateFamily(callbacks?: CreateFamilyCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateFamilyRequest) =>
      familyService.createFamily(request),
    onSuccess: (response) => {
      // Update with server response
      queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
        data: response.data,
      });
      callbacks?.onSuccess?.(response);
    },
    onError: (error: ApiException) => {
      callbacks?.onError?.(error);
    },
  });
}

interface AddMemberCallbacks {
  onSuccess?: (data: MemberMutationResponse) => void;
  onError?: (error: ApiException) => void;
}

/**
 * Add a new member to the family.
 */
export function useAddMember(callbacks?: AddMemberCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AddMemberRequest) => familyService.addMember(request),
    // Optimistic update
    onMutate: async (request) => {
      await queryClient.cancelQueries({ queryKey: familyKeys.family() });

      const previousData = queryClient.getQueryData<FamilyApiResponse>(
        familyKeys.family(),
      );

      if (previousData?.data) {
        const optimisticMember: FamilyMember = {
          id: `temp-${Date.now()}`, // Temporary ID, replaced on success
          ...request,
        };
        const optimisticFamily: FamilyData = {
          ...previousData.data,
          members: [...previousData.data.members, optimisticMember],
        };
        queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
          ...previousData,
          data: optimisticFamily,
        });
      }

      return { previousData };
    },
    onError: (error: ApiException, _request, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(familyKeys.family(), context.previousData);
      }
      callbacks?.onError?.(error);
    },
    onSuccess: (response) => {
      // Replace temp member with server response (which has real ID)
      const currentData = queryClient.getQueryData<FamilyApiResponse>(
        familyKeys.family(),
      );
      if (currentData?.data) {
        const updatedFamily: FamilyData = {
          ...currentData.data,
          members: currentData.data.members.map((m) =>
            m.id.startsWith("temp-") ? response.data : m,
          ),
        };
        queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
          ...currentData,
          data: updatedFamily,
        });
      }
      callbacks?.onSuccess?.(response);
    },
  });
}

interface UpdateMemberCallbacks {
  onSuccess?: (data: MemberMutationResponse) => void;
  onError?: (error: ApiException) => void;
}

/**
 * Update an existing member.
 */
export function useUpdateMember(callbacks?: UpdateMemberCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdateMemberRequest) =>
      familyService.updateMember(id, body),
    // Optimistic update
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: familyKeys.family() });

      const previousData = queryClient.getQueryData<FamilyApiResponse>(
        familyKeys.family(),
      );

      if (previousData?.data) {
        const optimisticFamily: FamilyData = {
          ...previousData.data,
          members: previousData.data.members.map((m) =>
            m.id === variables.id
              ? {
                  ...m,
                  name: variables.name,
                  color: variables.color,
                  avatarUrl:
                    variables.avatarUrl !== undefined
                      ? (variables.avatarUrl ?? undefined)
                      : m.avatarUrl,
                  email:
                    variables.email !== undefined ? variables.email : m.email,
                }
              : m,
          ),
        };
        queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
          ...previousData,
          data: optimisticFamily,
        });
      }

      return { previousData };
    },
    onError: (error: ApiException, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(familyKeys.family(), context.previousData);
      }
      callbacks?.onError?.(error);
    },
    onSuccess: (response, variables) => {
      // Update the specific member with server response
      const currentData = queryClient.getQueryData<FamilyApiResponse>(
        familyKeys.family(),
      );
      if (currentData?.data) {
        const updatedFamily: FamilyData = {
          ...currentData.data,
          members: currentData.data.members.map((m) =>
            m.id === variables.id ? response.data : m,
          ),
        };
        queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
          ...currentData,
          data: updatedFamily,
        });
      }
      callbacks?.onSuccess?.(response);
    },
  });
}

interface RemoveMemberCallbacks {
  onSuccess?: () => void;
  onError?: (error: ApiException) => void;
}

/**
 * Remove a member from the family.
 */
export function useRemoveMember(callbacks?: RemoveMemberCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => familyService.removeMember(id),
    // Optimistic delete
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: familyKeys.family() });

      const previousData = queryClient.getQueryData<FamilyApiResponse>(
        familyKeys.family(),
      );

      if (previousData?.data) {
        const optimisticFamily: FamilyData = {
          ...previousData.data,
          members: previousData.data.members.filter((m) => m.id !== memberId),
        };
        queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
          ...previousData,
          data: optimisticFamily,
        });
      }

      return { previousData };
    },
    onError: (error: ApiException, _memberId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(familyKeys.family(), context.previousData);
      }
      callbacks?.onError?.(error);
    },
    onSuccess: () => {
      callbacks?.onSuccess?.();
    },
  });
}

interface DeleteFamilyCallbacks {
  onSuccess?: () => void;
  onError?: (error: ApiException) => void;
}

/**
 * Delete the entire family (reset).
 */
export function useDeleteFamily(callbacks?: DeleteFamilyCallbacks) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => familyService.deleteFamily(),
    onSuccess: () => {
      // Clear query cache
      queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
        data: null,
      });
      callbacks?.onSuccess?.();
    },
    onError: (error: ApiException) => {
      callbacks?.onError?.(error);
    },
  });
}
