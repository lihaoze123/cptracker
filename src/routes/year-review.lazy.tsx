import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { StoryContainer } from "@/components/year-review/StoryContainer";
import { useProblems } from "@/hooks/use-problems-queries";
import { aggregateYearReviewData } from "@/lib/year-review/data-aggregation";
import { useAuthStore } from "@/stores/auth-store";
import { getCurrentUserProfile, type UserProfile } from "@/lib/supabase/profiles";
import { getEmailHash } from "@/lib/gravatar";

// Load decorative fonts for year-review (these are only loaded when this route is accessed)
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";

export const Route = createLazyFileRoute("/year-review")({
  component: YearReview,
});

function YearReview() {
  const { problems, isLoading } = useProblems();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  // Before February, show previous year's review
  const now = new Date();
  const year = now.getMonth() < 1 ? now.getFullYear() - 1 : now.getFullYear();

  // Fetch profile on mount
  useEffect(() => {
    if (user) {
      getCurrentUserProfile()
        .then(setProfile)
        .catch(console.error);
    }
  }, [user]);

  const userInfo = useMemo(() => {
    const username = profile?.username || user?.email?.split("@")[0] || "Anonymous";
    const displayName = profile?.display_name || undefined;
    const avatarHash = profile?.avatar_hash || (user?.email ? getEmailHash(user.email) : undefined);
    return { username, displayName, avatarHash };
  }, [profile, user]);

  const reviewData = useMemo(
    () => aggregateYearReviewData(problems, year, userInfo),
    [problems, year, userInfo]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white text-2xl font-serif">Generating your year in review...</div>
      </div>
    );
  }

  if (reviewData.totalProblems === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-center px-4">
        <div className="text-white text-4xl font-serif mb-4">
          No problems solved in {year}
        </div>
        <div className="text-gray-400 text-lg mb-8 font-sans">
          Start solving problems and check back next year!
        </div>
        <button
          onClick={() => navigate({ to: "/" })}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-sans"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <StoryContainer
      data={reviewData}
      onComplete={() => navigate({ to: "/" })}
    />
  );
}
