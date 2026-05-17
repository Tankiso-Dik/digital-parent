import {
  Check,
  ChevronDown,
  Cloud,
  Menu,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useFamilyMembers, useFamilyName } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks";
import { colorMap } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore, useCalendarStore } from "@/stores";

export function AppHeader() {
  // From calendar-store
  const currentDate = useCalendarStore((state) => state.currentDate);

  // From family-store
  const familyName = useFamilyName();
  const familyMembers = useFamilyMembers();

  // From app-store
  const openSidebar = useAppStore((state) => state.openSidebar);
  const activeMemberId = useAppStore((state) => state.activeMemberId);
  const setActiveMemberId = useAppStore((state) => state.setActiveMemberId);

  const activeMember = activeMemberId
    ? familyMembers.find((m) => m.id === activeMemberId)
    : null;

  // Mobile detection
  const isMobile = useIsMobile();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <header
      className={cn(
        "shrink-0 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85",
        "flex items-center justify-between",
        isMobile ? "min-h-16 px-4 py-3" : "px-6 py-4",
      )}
    >
      <div className={cn("flex items-center", isMobile ? "gap-3" : "gap-4")}>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Menu"
          className="text-muted-foreground hover:text-foreground"
          onClick={openSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] leading-7 font-semibold text-foreground">
              {familyName || "Digital Parent"}
            </h1>
          </div>
          {/* Date/time - hidden on mobile (device shows in status bar) */}
          {!isMobile && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatDate(currentDate)}</span>
              <span>•</span>
              <span>{formatTime(new Date())}</span>
            </div>
          )}
        </div>
      </div>

      <div className={cn("flex items-center", isMobile ? "gap-2" : "gap-6")}>
        {/* Weather - hidden on mobile (future: widget on desktop) */}
        {!isMobile && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="relative">
              <Sun className="h-5 w-5 text-yellow-500" />
              <Cloud className="h-4 w-4 text-gray-400 absolute -bottom-1 -right-1" />
            </div>
            <span className="text-sm font-medium">72°</span>
          </div>
        )}

        {/* Profile Switcher */}
        {!isMobile && familyMembers.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 h-9 border-border bg-card"
              >
                {activeMember ? (
                  <>
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full",
                        colorMap[activeMember.color]?.bg || "bg-gray-300",
                      )}
                    />
                    <span className="font-medium text-sm">
                      {activeMember.name}
                    </span>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Parent View</span>
                  </>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-2">
              <div className="space-y-1">
                <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Switch Profile
                </p>
                <button
                  onClick={() => setActiveMemberId(null)}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-2 text-sm rounded-md transition-colors hover:bg-accent",
                    !activeMemberId
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <span>Parent View</span>
                  </div>
                  {!activeMemberId && <Check className="h-4 w-4" />}
                </button>

                <div className="h-px bg-border my-1" />

                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setActiveMemberId(member.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-2 text-sm rounded-md transition-colors hover:bg-accent",
                      activeMemberId === member.id
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center",
                          colorMap[member.color]?.light || "bg-gray-100",
                        )}
                      >
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            colorMap[member.color]?.bg || "bg-gray-300",
                          )}
                        />
                      </div>
                      <span>{member.name}</span>
                    </div>
                    {activeMemberId === member.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Settings */}
        {!activeMemberId && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
}
