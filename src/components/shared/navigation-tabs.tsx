import {
  Calendar,
  CheckSquare,
  HeartPulse,
  ImageIcon,
  ListTodo,
  MonitorSmartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ModuleType, useAppStore } from "@/stores";

// Keep TabType export for backward compatibility
export type TabType = ModuleType;

const tabs = [
  { id: "habits" as ModuleType, label: "Habits", icon: MonitorSmartphone },
  { id: "calendar" as ModuleType, label: "School", icon: Calendar },
  { id: "chores" as ModuleType, label: "Tasks", icon: CheckSquare },
  { id: "lists" as ModuleType, label: "Rewards", icon: ListTodo },
  { id: "meals" as ModuleType, label: "Care", icon: HeartPulse },
  { id: "photos" as ModuleType, label: "Memories", icon: ImageIcon },
];

export function NavigationTabs() {
  const activeModule = useAppStore((state) => state.activeModule);
  const setActiveModule = useAppStore((state) => state.setActiveModule);

  return (
    <nav className="flex w-20 flex-col items-center gap-2 py-6 bg-card border-r border-border shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeModule === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveModule(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-3 rounded-xl w-16 transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
