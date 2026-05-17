import { ConvexAuthProvider, useConvexAuth } from "@convex-dev/auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, type ReactNode, Suspense, useEffect } from "react";
import { ApiException } from "@/api/client";
import { convex } from "@/lib/convex";
import { useAuthStore } from "@/stores";

// Lazy load DevTools - only loaded in dev mode
const ReactQueryDevtools = lazy(() =>
  import("@tanstack/react-query-devtools").then((m) => ({
    default: m.ReactQueryDevtools,
  })),
);

// Exported for cross-tab sync in family-store.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (ApiException.isApiException(error)) {
          if (error.status >= 400 && error.status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

function ConvexAuthStoreBridge({ children }: QueryProviderProps) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const setHasHydrated = useAuthStore((state) => state.setHasHydrated);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  useEffect(() => {
    setHasHydrated(!isLoading);
    setAuthenticated(isAuthenticated);
  }, [isLoading, isAuthenticated, setHasHydrated, setAuthenticated]);

  return <>{children}</>;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <ConvexAuthProvider client={convex}>
      <ConvexAuthStoreBridge>
        <QueryClientProvider client={queryClient}>
          {children}
          {import.meta.env.DEV && !import.meta.env.VITE_E2E && (
            <Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} />
            </Suspense>
          )}
        </QueryClientProvider>
      </ConvexAuthStoreBridge>
    </ConvexAuthProvider>
  );
}
