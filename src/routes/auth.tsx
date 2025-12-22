import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AuthPage, type AuthView } from "@/components/auth-page";

const authSearchSchema = z.object({
  view: z.enum(["login", "sign-up", "forgot-password", "update-password"]).optional().default("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  component: AuthRoute,
});

function AuthRoute() {
  const navigate = useNavigate();
  const { view } = Route.useSearch();

  const handleAuthSuccess = () => {
    navigate({ to: "/" });
  };

  return (
    <AuthPage
      initialView={view as AuthView}
      onSuccess={handleAuthSuccess}
    />
  );
}
