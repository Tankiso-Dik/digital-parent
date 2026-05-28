import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiException } from "@/api/client";
import { authService } from "@/api/services";
import { pb } from "@/lib/pb";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UsernameCheckResponse,
} from "@/lib/types";
import { familyKeys } from "./use-family";

// ============================================================================
// Query Keys Factory
// ============================================================================

export const authKeys = {
  all: ["auth"] as const,
  usernameCheck: (username: string) =>
    [...authKeys.all, "username", username] as const,
};

// ============================================================================
// Token Compatibility Helpers
// ============================================================================

export function getStoredToken(): string | null {
  return pb.authStore.token || null;
}

export function setStoredToken(token: string): void {
  if (token) {
    pb.authStore.save(token, pb.authStore.record);
  }
}

export function clearStoredToken(): void {
  pb.authStore.clear();
}

// ============================================================================
// Login Hook
// ============================================================================

interface LoginCallbacks {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: ApiException) => void;
}

export function useLogin(callbacks?: LoginCallbacks) {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, ApiException, LoginRequest>({
    mutationFn: authService.login,
    onSuccess: (response) => {
      queryClient.setQueryData(familyKeys.family(), {
        data: response.data.family,
      });
      callbacks?.onSuccess?.(response);
    },
    onError: (error: ApiException) => {
      callbacks?.onError?.(error);
    },
  });
}

// ============================================================================
// Register Hook
// ============================================================================

interface RegisterCallbacks {
  onSuccess?: (token: string) => void;
  onError?: (error: ApiException) => void;
}

export function useRegister(callbacks?: RegisterCallbacks) {
  const queryClient = useQueryClient();

  return useMutation<RegisterResponse, ApiException, RegisterRequest>({
    mutationFn: authService.register,
    onSuccess: (response) => {
      queryClient.setQueryData(familyKeys.family(), {
        data: response.data.family,
      });
      callbacks?.onSuccess?.(response.data.token);
    },
    onError: (error: ApiException) => {
      callbacks?.onError?.(error);
    },
  });
}

// ============================================================================
// Username Check Hook
// ============================================================================

export function useCheckUsername(username: string, enabled = true) {
  return useQuery<UsernameCheckResponse, ApiException>({
    queryKey: authKeys.usernameCheck(username),
    queryFn: () => authService.checkUsername(username),
    enabled: enabled && username.length >= 3,
    staleTime: 30 * 1000,
  });
}

// ============================================================================
// Logout Hook
// ============================================================================

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    pb.authStore.clear();
    queryClient.clear();
  };
}
