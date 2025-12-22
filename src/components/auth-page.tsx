import { useState } from "react";
import { SignUpForm } from "./sign-up-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { UpdatePasswordForm } from "./update-password-form";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type AuthView = "login" | "sign-up" | "forgot-password" | "update-password";

interface AuthPageProps {
  initialView?: AuthView;
  onSuccess?: () => void;
}

export function AuthPage({ initialView = "login", onSuccess }: AuthPageProps) {
  const [view, setView] = useState<AuthView>(initialView);

  return (
    <div className="flex flex-col items-center justify-center p-4 flex-1">
      <div className="w-full max-w-md">
        {view === "login" && <LoginFormWrapper onSuccess={onSuccess} onNavigate={setView} />}
        {view === "sign-up" && <SignUpFormWrapper onNavigate={setView} />}
        {view === "forgot-password" && <ForgotPasswordFormWrapper onNavigate={setView} />}
        {view === "update-password" && <UpdatePasswordFormWrapper onSuccess={onSuccess} />}
      </div>
    </div>
  );
}

// 包装登录表单以处理成功回调
function LoginFormWrapper({
  onSuccess,
  onNavigate,
}: {
  onSuccess?: () => void;
  onNavigate: (view: AuthView) => void;
}) {
  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest("a");
        if (anchor) {
          e.preventDefault();
          const href = anchor.getAttribute("href");
          if (href === "/sign-up") onNavigate("sign-up");
          else if (href === "/forgot-password") onNavigate("forgot-password");
        }
      }}
    >
      <LoginFormEnhanced onSuccess={onSuccess} />
    </div>
  );
}

// 增强版登录表单
function LoginFormEnhanced({
  className,
  onSuccess,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      onSuccess?.();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="/sign-up" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SignUpFormWrapper({ onNavigate }: { onNavigate: (view: AuthView) => void }) {
  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest("a");
        if (anchor) {
          e.preventDefault();
          const href = anchor.getAttribute("href");
          if (href === "/login") onNavigate("login");
        }
      }}
    >
      <SignUpForm />
    </div>
  );
}

function ForgotPasswordFormWrapper({ onNavigate }: { onNavigate: (view: AuthView) => void }) {
  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest("a");
        if (anchor) {
          e.preventDefault();
          const href = anchor.getAttribute("href");
          if (href === "/login") onNavigate("login");
        }
      }}
    >
      <ForgotPasswordForm />
    </div>
  );
}

function UpdatePasswordFormWrapper({ onSuccess }: { onSuccess?: () => void }) {
  return <UpdatePasswordForm onSuccess={onSuccess} />;
}
