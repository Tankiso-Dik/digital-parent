import { create } from "zustand";

/**
 * Auth store - mirrors Convex Auth state for top-level routing.
 *
 * The actual auth operations are handled by Convex Auth hooks in src/api/hooks/use-auth.ts.
 * QueryProvider bridges Convex Auth loading/authenticated state into this store so
 * App.tsx can keep its existing route gating.
 *
 * @see useLogin, useRegister, useLogout in @/api
 */
interface AuthHydrationState {
  /**
   * Whether the initial localStorage read has completed.
   */
  _hasHydrated: boolean;

  /**
   * Whether Convex Auth currently has an authenticated session.
   */
  isAuthenticated: boolean;

  setHasHydrated: (state: boolean) => void;
  setAuthenticated: (state: boolean) => void;
}

export const useAuthStore = create<AuthHydrationState>()((set) => ({
  _hasHydrated: false,
  isAuthenticated: false,
  setHasHydrated: (state) => set({ _hasHydrated: state }),
  setAuthenticated: (state) => set({ isAuthenticated: state }),
}));

// ============================================================================
// Selectors
// ============================================================================

/**
 * Check if auth store has hydrated from localStorage.
 * Use this to gate app rendering until we know the auth state.
 */
export const useAuthHasHydrated = () =>
  useAuthStore((state) => state._hasHydrated);

/**
 * Check if user is authenticated (has a token).
 */
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
