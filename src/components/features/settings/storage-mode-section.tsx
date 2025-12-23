/**
 * Storage Mode Section Component
 * Handles storage mode selection (local/cloud)
 */
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Cloud, HardDrive, Info } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import type { StorageMode } from "@/lib/storage-mode";

interface StorageModeSectionProps {
  onLoginRequired?: () => void;
}

export function StorageModeSection({ onLoginRequired }: StorageModeSectionProps) {
  const { storageMode, setStorageMode, user } = useAuth();

  const handleStorageModeChange = (value: StorageMode) => {
    if (value === "cloud" && !user) {
      onLoginRequired?.();
      return;
    }
    setStorageMode(value);
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Storage Mode</Label>
          <Badge variant={storageMode === "cloud" ? "default" : "secondary"}>
            {storageMode === "cloud" ? (
              <>
                <Cloud className="h-3 w-3 mr-1" />
                Cloud
              </>
            ) : (
              <>
                <HardDrive className="h-3 w-3 mr-1" />
                Local
              </>
            )}
          </Badge>
        </div>
        <Select value={storageMode} onValueChange={handleStorageModeChange}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="local">
              <div className="flex items-center gap-2 py-1">
                <HardDrive className="h-4 w-4" />
                <div>
                  <div className="font-medium">Local Only</div>
                  <div className="text-xs text-muted-foreground">
                    Browser storage
                  </div>
                </div>
              </div>
            </SelectItem>
            <SelectItem value="cloud">
              <div className="flex items-center gap-2 py-1">
                <Cloud className="h-4 w-4" />
                <div>
                  <div className="font-medium">Cloud Sync</div>
                  <div className="text-xs text-muted-foreground">
                    Multi-device access
                  </div>
                </div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {storageMode === "local"
              ? "Your data is stored locally in your browser using IndexedDB. It won't be synced across devices."
              : "Your data is synced to the cloud and stored locally for offline access. Access from any device."}
          </p>
        </div>
      </div>
      <Separator />
    </>
  );
}
