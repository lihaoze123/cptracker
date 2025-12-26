import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthPage, type AuthView } from "@/components/auth-page";

export const Route = createLazyFileRoute("/auth")({
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
