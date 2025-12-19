import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicProfileView } from "@/components/public-profile-view";

export const Route = createFileRoute("/$username")({
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
