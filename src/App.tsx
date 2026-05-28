import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useLogout, useSetupStatus } from "@/api";
import { CalendarModule } from "@/components/calendar";
import {
  AppHeader,
  MobileBottomNav,
  NavigationTabs,
  SidebarMenu,
} from "@/components/shared";
import { Toaster } from "@/components/ui/toaster";
import { useIsMobile } from "@/hooks";
import { usePbAuth } from "@/providers/pb-provider";
import { type ModuleType, useAppStore } from "@/stores";

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

function moduleFromPath(pathname: string): ModuleType {
  const [, segment] = pathname.split("/");

  switch (segment) {
    case "chores":
    case "lists":
    case "meals":
    case "calendar":
      return segment;
    default:
      return "calendar";
  }
}

function LoadingScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

function FamilyLoadErrorScreen() {
  const logout = useLogout();

  return (
    <div className="h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-foreground">
            Unable to load your family
          </h1>
          <p className="text-sm text-muted-foreground">
            Check that PocketBase is running, then try signing in again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to sign in
        </button>
      </div>
      <Toaster />
    </div>
  );
}

export default function FamilyHub() {
  const location = useLocation();
  const activeModule = useAppStore((state) => state.activeModule);
  const setActiveModule = useAppStore((state) => state.setActiveModule);
  const { isReady, isAuthenticated } = usePbAuth();
  const setupStatus = useSetupStatus();
  const isMobile = useIsMobile();

  // State to toggle between login and onboarding for new users
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const routeModule = moduleFromPath(location.pathname);
    if (activeModule !== routeModule) {
      setActiveModule(routeModule);
    }
  }, [location.pathname, activeModule, setActiveModule]);

  // Keep legacy null routes on the primary calendar view.
  useEffect(() => {
    if (!isMobile && activeModule === null) {
      setActiveModule("calendar");
    }
  }, [isMobile, activeModule, setActiveModule]);

  // A completed registration authenticates the user from the onboarding flow.
  // Clear the local toggle so a later logout returns to sign in, not onboarding.
  useEffect(() => {
    if (isAuthenticated) {
      setShowOnboarding(false);
    }
  }, [isAuthenticated]);

  if (!isReady) {
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

  if (setupStatus.isLoading) {
    return <LoadingScreen />;
  }

  if (setupStatus.isError) {
    return <FamilyLoadErrorScreen />;
  }

  // Authenticated but setup not complete (edge case)
  if (!setupStatus.isComplete) {
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
            <Routes>
              <Route path="/" element={<Navigate to="/calendar" replace />} />
              <Route path="/calendar" element={<CalendarModule />} />
              <Route path="/calendar/:date" element={<CalendarModule />} />
              <Route
                path="/chores"
                element={
                  <Suspense fallback={<ModuleLoader />}>
                    <ChoresView />
                  </Suspense>
                }
              />
              <Route
                path="/lists"
                element={
                  <Suspense fallback={<ModuleLoader />}>
                    <ListsView />
                  </Suspense>
                }
              />
              <Route
                path="/meals"
                element={
                  <Suspense fallback={<ModuleLoader />}>
                    <MealsView />
                  </Suspense>
                }
              />
              <Route
                path="*"
                element={renderModule(activeModule ?? "calendar")}
              />
            </Routes>
          </main>
        </div>

        {isMobile && isAuthenticated && setupStatus.isComplete && (
          <MobileBottomNav />
        )}
        <SidebarMenu />
      </div>
      <Toaster />
    </>
  );
}
