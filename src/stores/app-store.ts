import { create } from "zustand";

export type ModuleType =
  | "habits"
  | "calendar"
  | "lists"
  | "chores"
  | "meals"
  | "photos";

interface AppState {
  // State
  activeModule: ModuleType | null; // null = legacy home dashboard route
  isSidebarOpen: boolean;

  // Actions
  setActiveModule: (module: ModuleType | null) => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state - Digital Habits is the parenting command center.
  activeModule: "habits",
  isSidebarOpen: false,

  // Actions
  setActiveModule: (module) => set({ activeModule: module }),
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
