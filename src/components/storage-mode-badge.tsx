import { Badge } from "@/components/ui/badge";
import { Cloud, HardDrive, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface StorageModeBadgeProps {
  isCloudMode: boolean;
  isSyncing?: boolean;
}

export function StorageModeBadge({ isCloudMode, isSyncing }: StorageModeBadgeProps) {
  return (
    <Badge
      variant={isCloudMode ? "default" : "outline"}
      className={cn(
        "px-3 py-1.5 text-sm font-medium transition-all",
        isCloudMode && "bg-blue-500 hover:bg-blue-600 text-white border-blue-500 animate-pulse-glow",
        !isCloudMode && "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      <div className="flex items-center gap-2">
        {isCloudMode ? (
          <Cloud className="h-4 w-4" />
        ) : (
          <HardDrive className="h-4 w-4" />
        )}
        <span>{isCloudMode ? "Cloud Mode" : "Local Mode"}</span>
        {isSyncing && <RefreshCw className="h-3.5 w-3.5 animate-spin ml-1" />}
      </div>
    </Badge>
  );
}
