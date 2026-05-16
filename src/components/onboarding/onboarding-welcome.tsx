import { Calendar, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingWelcomeProps {
  onNext: () => void;
}

export function OnboardingWelcome({ onNext }: OnboardingWelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-6 bg-gradient-to-b from-primary/10 to-background">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo / Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <Heart className="h-12 w-12 text-primary-foreground" />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to Digital Parent
          </h1>
          <p className="text-lg text-muted-foreground">
            Your all-in-one companion for managing the family's schedule, tasks,
            meals, and daily life.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Shared Family Calendar
              </p>
              <p className="text-sm text-muted-foreground">
                See everyone's schedule at a glance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Children's Profiles</p>
              <p className="text-sm text-muted-foreground">
                Track each child's activities with color-coded events
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button size="lg" className="w-full" onClick={onNext}>
          Get Started
        </Button>
      </div>
    </div>
  );
}
