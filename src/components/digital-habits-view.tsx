import {
  BookOpen,
  Brain,
  Gamepad2,
  GraduationCap,
  MessageCircle,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TimerReset,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useFamilyMembers } from "@/api";
import { Button } from "@/components/ui/button";
import { colorMap } from "@/lib/types";
import { cn } from "@/lib/utils";

type UsageCategory = "Learning" | "Entertainment" | "Social";

interface AppUsageSession {
  id: string;
  childId: string;
  appName: string;
  durationMinutes: number;
  category: UsageCategory;
  date: string;
}

const categoryStyles: Record<
  UsageCategory,
  { label: string; bar: string; surface: string; text: string }
> = {
  Learning: {
    label: "Learning",
    bar: "bg-[#2f827f]",
    surface: "bg-[#e0f4f3]",
    text: "text-[#2d6360]",
  },
  Entertainment: {
    label: "Entertainment",
    bar: "bg-[#b95443]",
    surface: "bg-[#fbe9e6]",
    text: "text-[#8b3d32]",
  },
  Social: {
    label: "Social",
    bar: "bg-[#7052ad]",
    surface: "bg-[#ede6f7]",
    text: "text-[#523d70]",
  },
};

const appIcons = [
  { appName: "Khan Kids", icon: GraduationCap, accent: "bg-[#2f827f]" },
  { appName: "Reading Eggs", icon: BookOpen, accent: "bg-[#467c4b]" },
  { appName: "YouTube Kids", icon: Play, accent: "bg-[#b95443]" },
  { appName: "Minecraft", icon: Gamepad2, accent: "bg-[#7052ad]" },
  { appName: "Messages", icon: MessageCircle, accent: "bg-[#aa4d77]" },
];

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function makeUsageSessions(childIds: string[]): AppUsageSession[] {
  const today = getTodayKey();
  const [firstChildId = "child-1", secondChildId = "child-2"] = childIds;

  return [
    {
      id: "usage-khan",
      childId: firstChildId,
      appName: "Khan Kids",
      durationMinutes: 34,
      category: "Learning",
      date: today,
    },
    {
      id: "usage-reading",
      childId: firstChildId,
      appName: "Reading Eggs",
      durationMinutes: 22,
      category: "Learning",
      date: today,
    },
    {
      id: "usage-youtube",
      childId: firstChildId,
      appName: "YouTube Kids",
      durationMinutes: 28,
      category: "Entertainment",
      date: today,
    },
    {
      id: "usage-minecraft",
      childId: secondChildId,
      appName: "Minecraft",
      durationMinutes: 38,
      category: "Entertainment",
      date: today,
    },
    {
      id: "usage-messages",
      childId: secondChildId,
      appName: "Messages",
      durationMinutes: 12,
      category: "Social",
      date: today,
    },
    {
      id: "usage-reading-jack",
      childId: secondChildId,
      appName: "Reading Eggs",
      durationMinutes: 18,
      category: "Learning",
      date: today,
    },
  ];
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export function DigitalHabitsView() {
  const members = useFamilyMembers();
  const childMembers = members.length > 0 ? members.slice(-2) : [];
  const fallbackChildren =
    childMembers.length > 0
      ? childMembers
      : [
          { id: "child-1", name: "Emma", color: "green" as const },
          { id: "child-2", name: "Jack", color: "purple" as const },
        ];
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const usageSessions = useMemo(
    () => makeUsageSessions(fallbackChildren.map((child) => child.id)),
    [fallbackChildren],
  );
  const filteredUsage =
    selectedChildId === "all"
      ? usageSessions
      : usageSessions.filter((session) => session.childId === selectedChildId);
  const totalMinutes = filteredUsage.reduce(
    (sum, session) => sum + session.durationMinutes,
    0,
  );
  const learningMinutes = filteredUsage
    .filter((session) => session.category === "Learning")
    .reduce((sum, session) => sum + session.durationMinutes, 0);
  const learningRatio =
    totalMinutes > 0 ? Math.round((learningMinutes / totalMinutes) * 100) : 0;
  const dailyLimitMinutes = selectedChildId === "all" ? 210 : 105;
  const remainingMinutes = Math.max(dailyLimitMinutes - totalMinutes, 0);
  const progress = Math.min((totalMinutes / dailyLimitMinutes) * 100, 100);
  const categoryTotals = (["Learning", "Entertainment", "Social"] as const).map(
    (category) => ({
      category,
      minutes: filteredUsage
        .filter((session) => session.category === category)
        .reduce((sum, session) => sum + session.durationMinutes, 0),
    }),
  );

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:py-8">
        {/* App name label */}
        <div className="flex justify-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Digital Parent
          </span>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[2rem] bg-[#23342f] p-5 text-[#fffaf0] shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <p className="text-sm font-semibold text-[#bde5d9]">
                  Today's parenting brief
                </p>
                <h1 className="mt-2 text-[32px] font-bold leading-10 sm:text-[40px] sm:leading-[48px]">
                  Digital habits are calm and on track.
                </h1>
              </div>
              <div className="rounded-2xl bg-[#fffaf0]/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-[#bde5d9]">
                  Remaining
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatMinutes(remainingMinutes)}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">
                  {formatMinutes(totalMinutes)} used
                </span>
                <span className="text-[#d9eee8]">
                  {formatMinutes(dailyLimitMinutes)} daily limit
                </span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#fffaf0]/15">
                <div
                  className="h-full rounded-full bg-[#f4c95d]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <BriefMetric
                icon={BookOpen}
                label="Learning share"
                value={`${learningRatio}%`}
              />
              <BriefMetric
                icon={ShieldCheck}
                label="Over-limit apps"
                value="0"
              />
              <BriefMetric icon={Trophy} label="Points earned" value="+65" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  App balance
                </h2>
                <p className="text-sm text-muted-foreground">
                  Learning, play, and social time at a glance.
                </p>
              </div>
              <Smartphone className="h-6 w-6 text-primary" />
            </div>

            <div className="mt-6 space-y-4">
              {categoryTotals.map(({ category, minutes }) => {
                const width =
                  totalMinutes > 0
                    ? Math.max((minutes / totalMinutes) * 100, 6)
                    : 6;
                const styles = categoryStyles[category];

                return (
                  <div key={category}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className={cn("font-semibold", styles.text)}>
                        {styles.label}
                      </span>
                      <span className="text-muted-foreground">
                        {formatMinutes(minutes)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", styles.bar)}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-primary/10 p-4">
              <div className="flex items-start gap-3">
                <Brain className="mt-0.5 h-5 w-5 text-primary" />
                <p className="text-sm leading-6 text-foreground">
                  Learning time is ahead of entertainment today. Keep the
                  evening routine simple and protect bedtime.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={selectedChildId === "all" ? "default" : "outline"}
            onClick={() => setSelectedChildId("all")}
          >
            All children
          </Button>
          {fallbackChildren.map((child) => (
            <Button
              key={child.id}
              type="button"
              variant={selectedChildId === child.id ? "default" : "outline"}
              onClick={() => setSelectedChildId(child.id)}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  colorMap[child.color]?.bg,
                )}
              />
              {child.name}
            </Button>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  App usage
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manual tracking for a future connected-device view.
                </p>
              </div>
              <TimerReset className="h-6 w-6 text-primary" />
            </div>

            <div className="mt-5 space-y-3">
              {appIcons.map((app) => {
                const Icon = app.icon;
                const minutes = filteredUsage
                  .filter((session) => session.appName === app.appName)
                  .reduce((sum, session) => sum + session.durationMinutes, 0);

                return (
                  <div
                    key={app.appName}
                    className="flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white",
                          app.accent,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {app.appName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {minutes > 0 ? "Used today" : "No use today"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatMinutes(minutes)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Rewards unlocked
                </h2>
                <p className="text-sm text-muted-foreground">
                  Healthy digital choices feed the reward bank.
                </p>
              </div>
              <Sparkles className="h-6 w-6 text-primary" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <RewardCard title="Extra reading app time" points="50 pts" />
              <RewardCard title="Friday movie pick" points="150 pts" />
              <RewardCard title="Creative game session" points="80 pts" />
              <RewardCard title="Parent-child tech project" points="120 pts" />
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-foreground">
                Suggested next step
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Trade 25 entertainment minutes for a reading streak bonus after
                homework is checked off.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function BriefMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#fffaf0]/10 p-4">
      <Icon className="h-5 w-5 text-[#f4c95d]" />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="text-xs font-semibold text-[#d9eee8]">{label}</p>
    </div>
  );
}

function RewardCard({ title, points }: { title: string; points: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-xs font-semibold text-primary">{points}</p>
    </div>
  );
}
