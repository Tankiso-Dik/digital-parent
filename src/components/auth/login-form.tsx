import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { choreKeys, familyKeys, listsKeys, useLogin } from "@/api";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { seedDemoSession } from "@/lib/demo-data";
import { type LoginFormData, loginFormSchema } from "@/lib/validations/auth";
import { useAuthStore } from "@/stores";

interface LoginFormProps {
  onSwitchToOnboarding: () => void;
}

export function LoginForm({ onSwitchToOnboarding }: LoginFormProps) {
  const login = useLogin();
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setDemoMode = useAuthStore((state) => state.setDemoMode);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login.mutate(data, {
      onSuccess: () => {
        // Update auth store to trigger re-render
        setAuthenticated(true);
        setDemoMode(false);
      },
      onError: (error) => {
        if (error.code === "UNAUTHORIZED") {
          setError("root", { message: "Invalid username or password" });
        } else {
          setError("root", { message: "An error occurred. Please try again." });
        }
      },
    });
  };

  const handleDemoLogin = () => {
    const demo = seedDemoSession();
    queryClient.clear();
    queryClient.setQueryData(familyKeys.family(), { data: demo.family });
    queryClient.setQueryData(choreKeys.list(), { data: demo.chores });
    queryClient.setQueryData(listsKeys.hub(), {
      data: demo.lists.map((list) => ({
        id: list.id,
        name: list.name,
        kind: list.kind,
        totalItems: list.items.length,
        completedItems: list.items.filter((item) => item.completed).length,
      })),
    });
    queryClient.setQueryData(listsKeys.preferences(), {
      data: demo.listPreferences,
    });
    setDemoMode(true);
    setAuthenticated(true);
  };

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-6 bg-background">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-3 text-center">
            <h1 className="text-2xl font-bold text-foreground">
              Welcome Back!
            </h1>
            <p className="text-muted-foreground">
              Sign in to your parenting dashboard
            </p>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleDemoLogin}
            >
              Try Demo - See it in action
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>
          </div>

          {errors.root && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive text-center">
                {errors.root.message}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                placeholder="your_username"
                autoComplete="username"
                autoFocus
                {...register("username")}
              />
              <FormError message={errors.username?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="********"
                autoComplete="current-password"
                {...register("password")}
              />
              <FormError message={errors.password?.message} />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={login.isPending}
          >
            {login.isPending ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              New to Digital Parent?{" "}
              <button
                type="button"
                onClick={onSwitchToOnboarding}
                className="text-primary hover:underline font-medium"
              >
                Create an account
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
