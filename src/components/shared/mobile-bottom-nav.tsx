import {
  Calendar,
  CheckSquare,
  HeartPulse,
  ListTodo,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { type ModuleType, useAppStore } from "@/stores";

const tabs: Array<{ id: ModuleType | null; label: string; icon: LucideIcon }> =
  [
    { id: "calendar", label: "Schedule", icon: Calendar },
    { id: "chores", label: "Tasks", icon: CheckSquare },
    { id: "lists", label: "Planning", icon: ListTodo },
    { id: "meals", label: "Routines", icon: HeartPulse },
  ];

export function MobileBottomNav() {
  const navigate = useNavigate();
  const activeModule = useAppStore((state) => state.activeModule);
  const setActiveModule = useAppStore((state) => state.setActiveModule);

  return (
    <nav
      aria-label="Primary"
      className="z-30 shrink-0 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85"
    >
      <div
        className="grid grid-cols-4 gap-1 px-2 pt-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeModule === tab.id;

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setActiveModule(tab.id);
                navigate(`/${tab.id ?? "calendar"}`);
              }}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] leading-none font-semibold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate leading-[14px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
