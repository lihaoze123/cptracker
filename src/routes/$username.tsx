import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { PublicProfileView } from "@/components/public-profile-view";

export const Route = createFileRoute("/$username")({
  validateSearch: z.object({
    solution: z.string().optional(),
  }),
  component: PublicProfileRoute,
});

function PublicProfileRoute() {
  const navigate = useNavigate();
  const { username } = Route.useParams();

  const handleBackToHome = () => {
    navigate({ to: "/" });
  };

  return (
    <PublicProfileView
      username={username}
      onBack={handleBackToHome}
    />
  );
}
