import { lazy, Suspense, useEffect, useState } from "react";
import { useSetupComplete } from "@/api";
import { CalendarModule } from "@/components/calendar";
import {
  AppHeader,
  MobileBottomNav,
  NavigationTabs,
  SidebarMenu,
} from "@/components/shared";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks";
import {
  type ModuleType,
  useAppStore,
  useAuthHasHydrated,
  useHasHydrated,
  useIsAuthenticated,
} from "@/stores";

// Lazy load non-primary modules for code splitting
const ChoresView = lazy(() =>
  import("@/components/chores-view").then((m) => ({ default: m.ChoresView })),
);
const ListsView = lazy(() =>
  import("@/components/lists-view").then((m) => ({ default: m.ListsView })),
);
const MealsView = lazy(() =>
  import("@/components/meals-view").then((m) => ({ default: m.MealsView })),
);
const OnboardingFlow = lazy(() =>
  import("@/components/onboarding").then((m) => ({
    default: m.OnboardingFlow,
  })),
);
const LoginFlow = lazy(() =>
  import("@/components/auth").then((m) => ({ default: m.LoginFlow })),
);

function ModuleLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

function renderModule(activeModule: ModuleType | null) {
  if (activeModule === null) {
    return <CalendarModule />;
  }

  switch (activeModule) {
    case "calendar":
      return <CalendarModule />;
    case "chores":
      return (
        <Suspense fallback={<ModuleLoader />}>
          <ChoresView />
        </Suspense>
      );
    case "lists":
      return (
        <Suspense fallback={<ModuleLoader />}>
          <ListsView />
        </Suspense>
      );
    case "meals":
      return (
        <Suspense fallback={<ModuleLoader />}>
          <MealsView />
        </Suspense>
      );
    default:
      return null;
  }
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

export default function FamilyHub() {
  const activeModule = useAppStore((state) => state.activeModule);
  const setActiveModule = useAppStore((state) => state.setActiveModule);
  const hasHydrated = useHasHydrated();
  const authHasHydrated = useAuthHasHydrated();
  const isAuthenticated = useIsAuthenticated();
  const setupComplete = useSetupComplete();
  const isMobile = useIsMobile();

  // State to toggle between login and onboarding for new users
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Keep legacy null routes on the primary calendar view.
  useEffect(() => {
    if (!isMobile && activeModule === null) {
      setActiveModule("calendar");
    }
  }, [isMobile, activeModule, setActiveModule]);

  // Wait for both stores to hydrate from localStorage
  if (!hasHydrated || !authHasHydrated) {
    return <LoadingScreen />;
  }

  // Not authenticated: show login or onboarding
  if (!isAuthenticated) {
    if (showOnboarding) {
      return (
        <>
          <Suspense fallback={<LoadingScreen />}>
            <OnboardingFlow />
          </Suspense>
          <Toaster />
        </>
      );
    }
    return (
      <>
        <Suspense fallback={<LoadingScreen />}>
          <LoginFlow onStartOnboarding={() => setShowOnboarding(true)} />
        </Suspense>
        <Toaster />
      </>
    );
  }

  // Authenticated but setup not complete (edge case)
  if (!setupComplete) {
    return (
      <>
        <Suspense fallback={<LoadingScreen />}>
          <OnboardingFlow />
        </Suspense>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="h-screen flex flex-col bg-background">
        {!(isMobile && activeModule === "calendar") && <AppHeader />}

        <div className="flex-1 flex min-h-0 overflow-hidden">
          {!isMobile && <NavigationTabs />}
          <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {renderModule(activeModule)}
          </main>
        </div>

        {isMobile && isAuthenticated && setupComplete && <MobileBottomNav />}
        <SidebarMenu />
      </div>
      <Toaster />
    </>
  );
}
