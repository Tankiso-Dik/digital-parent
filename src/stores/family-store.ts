/**
 * Family data is no longer hydrated from localStorage.
 *
 * Family server state lives in TanStack Query and is fetched from PocketBase.
 * This compatibility selector stays true while older app code is migrated away
 * from hydration checks.
 */
export const useHasHydrated = () => true;

export const useFamilyStore = {
  getState: () => ({ _hasHydrated: true, setHasHydrated: () => undefined }),
  setState: () => undefined,
};
