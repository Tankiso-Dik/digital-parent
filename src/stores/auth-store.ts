import { usePbAuth } from "@/providers/pb-provider";

/**
 * Auth state now comes directly from PocketBase.
 *
 * This module keeps the old selector names temporarily so migrated UI can move
 * feature by feature without importing PocketBase everywhere at once.
 */
export const useAuthHasHydrated = () => usePbAuth().isReady;

export const useIsAuthenticated = () => usePbAuth().isAuthenticated;
