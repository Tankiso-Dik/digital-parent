import { create } from "zustand";

export type ModuleType = "calendar" | "lists" | "chores" | "meals";

interface AppState {
  // State
  activeModule: ModuleType | null; // null = legacy home dashboard route
  isSidebarOpen: boolean;
  activeMemberId: string | null; // null = Parent View

  // Actions
  setActiveModule: (module: ModuleType | null) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setActiveMemberId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state - Calendar is the primary family planning surface.
  activeModule: "calendar",
  isSidebarOpen: false,
  activeMemberId: null, // default to Parent View

  // Actions
  setActiveModule: (module) => set({ activeModule: module }),
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setActiveMemberId: (id) => set({ activeMemberId: id }),
}));
