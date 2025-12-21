import { cn } from "@/lib/utils";

interface RatingBadgeProps {
  rating: number | string;
  className?: string;
}

function getRatingColor(rating: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (rating < 1200) {
    return {
      bg: "bg-gray-500",
      text: "text-white",
      border: "border-gray-600",
    };
  }
  if (rating < 1400) {
    return {
      bg: "bg-green-500",
      text: "text-white",
      border: "border-green-600",
    };
  }
  if (rating < 1600) {
    return {
      bg: "bg-cyan-500",
      text: "text-white",
      border: "border-cyan-600",
    };
  }
  if (rating < 1900) {
    return {
      bg: "bg-blue-500",
      text: "text-white",
      border: "border-blue-600",
    };
  }
  if (rating < 2100) {
    return {
      bg: "bg-purple-500",
      text: "text-white",
      border: "border-purple-600",
    };
  }
  if (rating < 2400) {
    return {
      bg: "bg-orange-500",
      text: "text-white",
      border: "border-orange-600",
    };
  }
  if (rating < 2600) {
    return {
      bg: "bg-red-400",
      text: "text-white",
      border: "border-red-500",
    };
  }
  if (rating < 3000) {
    return {
      bg: "bg-red-500",
      text: "text-white",
      border: "border-red-600",
    };
  }
  return {
    bg: "bg-red-800",
    text: "text-white",
    border: "border-red-900",
  };
}

export function RatingBadge({ rating, className }: RatingBadgeProps) {
  const numRating = typeof rating === "string" ? parseInt(rating, 10) : rating;

  if (isNaN(numRating)) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 text-xs font-medium border",
          "bg-gray-100 text-gray-600 border-gray-300",
          "dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600",
          className
        )}
      >
        N/A
      </span>
    );
  }

  const colors = getRatingColor(numRating);

  return (
    <span
      className={cn(
        "inline-flex items-center px-1 py-0.5 text-xs font-medium border",
        colors.bg,
        colors.text,
        colors.border,
        className
      )}
    >
      {numRating}
    </span>
  );
}
