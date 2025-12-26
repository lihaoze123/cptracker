import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicProfileView } from "@/components/public-profile-view";

export const Route = createLazyFileRoute("/$username/")({
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
