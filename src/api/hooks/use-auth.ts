import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiException } from "@/api/client";
import { ApiErrorCode, ApiException as ApiExceptionClass } from "@/api/client";
import { authService } from "@/api/services";
import { AUTH_TOKEN_STORAGE_KEY, FAMILY_STORAGE_KEY } from "@/lib/constants";
import { convex } from "@/lib/convex";
import type {
  FamilyApiResponse,
  FamilyData,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UsernameCheckResponse,
} from "@/lib/types";
import { api } from "../../../convex/_generated/api";
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
// Token Storage Helpers
// ============================================================================

/**
 * Get stored auth token from localStorage.
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Save auth token to localStorage.
 */
export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to save token to localStorage:", error);
    }
  }
}

/**
 * Remove auth token from localStorage.
 */
export function clearStoredToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to clear token from localStorage:", error);
    }
  }
}

/**
 * Write family data to localStorage (Zustand persist format).
 */
function writeFamilyToStorage(family: FamilyData): void {
  try {
    const stored = {
      state: {
        family,
        _hasHydrated: true,
      },
      version: 0,
    };
    localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to write family to localStorage:", error);
    }
  }
}

function usernameToAuthEmail(username: string) {
  return `${username.trim().toLowerCase()}@digital-parent.local`;
}

function asFamilyData(family: FamilyData): FamilyData {
  return family;
}

function mapConvexError(error: unknown): ApiException {
  if (ApiExceptionClass.isApiException(error)) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("invalid credentials")) {
    return new ApiExceptionClass(
      {
        code: ApiErrorCode.UNAUTHORIZED,
        message: "Invalid username or password",
        status: 401,
      },
      error,
    );
  }

  if (lowerMessage.includes("already") || lowerMessage.includes("duplicate")) {
    return new ApiExceptionClass(
      {
        code: ApiErrorCode.CONFLICT,
        message: "Username is already taken",
        status: 409,
      },
      error,
    );
  }

  if (lowerMessage.includes("invalid")) {
    return new ApiExceptionClass(
      {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: "Invalid credentials",
        status: 422,
      },
      error,
    );
  }

  return new ApiExceptionClass(
    {
      code: ApiErrorCode.SERVER_ERROR,
      message: "Authentication failed",
      status: 500,
    },
    error,
  );
}

// ============================================================================
// Login Hook
// ============================================================================

interface LoginCallbacks {
  onSuccess?: (data: LoginResponse) => void;
  onError?: (error: ApiException) => void;
}

/**
 * Login mutation that signs in with Convex Auth and updates family cache.
 */
export function useLogin(callbacks?: LoginCallbacks) {
  const authActions = useAuthActions() as
    | ReturnType<typeof useAuthActions>
    | undefined;
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, ApiException, LoginRequest>({
    mutationFn: async (request: LoginRequest) => {
      if (!authActions) {
        return authService.login(request);
      }

      try {
        await authActions.signIn("password", {
          flow: "signIn",
          username: request.username,
          email: usernameToAuthEmail(request.username),
          password: request.password,
        });

        const family = await convex.query(api.family.getFamily, {});
        if (!family.data) {
          throw new Error("No family found");
        }

        return {
          data: {
            token: "",
            family: asFamilyData(family.data as FamilyData),
          },
        };
      } catch (error) {
        throw mapConvexError(error);
      }
    },
    onSuccess: (response) => {
      // Update family query cache
      queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
        data: response.data.family,
      });

      // Write family to localStorage for hydration
      writeFamilyToStorage(response.data.family);

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
  onSuccess?: (data: RegisterResponse) => void;
  onError?: (error: ApiException) => void;
}

/**
 * Register mutation that creates a Convex Auth account, family, and cache state.
 */
export function useRegister(callbacks?: RegisterCallbacks) {
  const authActions = useAuthActions() as
    | ReturnType<typeof useAuthActions>
    | undefined;
  const queryClient = useQueryClient();

  return useMutation<RegisterResponse, ApiException, RegisterRequest>({
    mutationFn: async (request: RegisterRequest) => {
      if (!authActions) {
        return authService.register(request);
      }

      try {
        await authActions.signIn("password", {
          flow: "signUp",
          username: request.username,
          email: usernameToAuthEmail(request.username),
          password: request.password,
        });

        const family = await convex.mutation(api.family.createFamily, {
          name: request.familyName,
          members: request.members,
        });

        return {
          data: {
            token: "",
            family: asFamilyData(family.data as FamilyData),
          },
        };
      } catch (error) {
        throw mapConvexError(error);
      }
    },
    onSuccess: (response) => {
      // Update family query cache
      queryClient.setQueryData<FamilyApiResponse>(familyKeys.family(), {
        data: response.data.family,
      });

      // Write family to localStorage for hydration
      writeFamilyToStorage(response.data.family);

      callbacks?.onSuccess?.(response);
    },
    onError: (error: ApiException) => {
      callbacks?.onError?.(error);
    },
  });
}

// ============================================================================
// Username Check Hook
// ============================================================================

/**
 * Check if a username is available.
 * Only runs when username is at least 3 characters.
 */
export function useCheckUsername(username: string, enabled = true) {
  return useQuery<UsernameCheckResponse, ApiException>({
    queryKey: authKeys.usernameCheck(username),
    queryFn: async () => {
      if (import.meta.env.MODE === "test") {
        return authService.checkUsername(username);
      }

      return convex.query(api.auth.checkUsername, { username });
    },
    enabled: enabled && username.length >= 3,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================================================
// Logout Hook
// ============================================================================

/**
 * Returns a logout function that clears auth state and reloads the page.
 */
export function useLogout() {
  const authActions = useAuthActions() as
    | ReturnType<typeof useAuthActions>
    | undefined;
  const queryClient = useQueryClient();

  return async () => {
    if (authActions) {
      await authActions.signOut();
    }

    // Clear token from storage
    clearStoredToken();

    // Clear family data from localStorage
    localStorage.removeItem(FAMILY_STORAGE_KEY);

    // Clear all query cache
    queryClient.clear();

    // Force page reload to reset all state
    window.location.reload();
  };
}
