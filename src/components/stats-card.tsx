import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  isLoading?: boolean;
}

function useCountUp(target: number, duration: number = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target); // Ensure final value is exact
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

const MotionCard = motion(Card);

export function StatsCard({ title, value, icon: Icon, isLoading }: StatsCardProps) {
  const displayValue = useCountUp(value, 1000);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-4">
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <MotionCard
      whileHover={{ y: -2 }}
      className="transition-all hover:shadow-md"
    >
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold tabular-nums">{displayValue}</div>
            <div className="text-sm text-muted-foreground mt-1">{title}</div>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
      </CardContent>
    </MotionCard>
  );
}
