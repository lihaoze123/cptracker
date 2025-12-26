/**
 * Time Range Selector
 * Allows users to switch between 7D, 30D, and 1Y time ranges
 */
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TimeRange } from "./chart-utils";
import { TIME_RANGE_OPTIONS } from "./chart-utils";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1 border border-border rounded-none p-0.5">
      {TIME_RANGE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "ghost"}
          size="xs"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-6 px-2 text-xs",
            value === option.value && "bg-primary text-primary-foreground"
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
