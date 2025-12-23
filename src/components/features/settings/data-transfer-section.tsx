/**
 * Data Transfer Section Component
 * Handles upload/download operations between local and cloud
 */
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Info, Upload, Download } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { fetchAllProblems } from "@/lib/supabase/database";

interface DataTransferSectionProps {
  onUploadClick?: () => void;
  onDownloadClick?: () => void;
  isSyncing?: boolean;
}

export function DataTransferSection({
  onUploadClick,
  onDownloadClick,
  isSyncing = false,
}: DataTransferSectionProps) {
  const { user, storageMode } = useAuth();
  const [cloudProblemCount, setCloudProblemCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Fetch cloud problem count
  useEffect(() => {
    const fetchCloudCount = async () => {
      if (user) {
        setIsLoadingCount(true);
        try {
          const problems = await fetchAllProblems();
          setCloudProblemCount(problems.length);
        } catch (error) {
          console.error("Failed to fetch cloud problem count:", error);
          setCloudProblemCount(null);
        } finally {
          setIsLoadingCount(false);
        }
      } else {
        setCloudProblemCount(null);
      }
    };

    fetchCloudCount();
  }, [user]);

  return (
    <>
      {/* Cloud Storage Info */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Cloud Storage</Label>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Problems in Cloud</p>
              <p className="text-xs text-muted-foreground">
                Total problems stored in Supabase
              </p>
            </div>
            <div className="text-right">
              {isLoadingCount ? (
                <div className="text-2xl font-bold text-muted-foreground">...</div>
              ) : (
                <div className="text-2xl font-bold">{cloudProblemCount ?? 0}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Data Transfer Operations */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Data Transfer</Label>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3"
            onClick={onUploadClick}
            disabled={isSyncing}
          >
            <Upload className="h-4 w-4 mr-2 flex-shrink-0" />
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm">Upload Local to Cloud</span>
              <span className="text-xs text-muted-foreground font-normal">
                Local → Cloud (overwrites cloud)
              </span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3"
            onClick={onDownloadClick}
            disabled={isSyncing}
          >
            <Download className="h-4 w-4 mr-2 flex-shrink-0" />
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm">Download Cloud to Local</span>
              <span className="text-xs text-muted-foreground font-normal">
                Cloud → Local (overwrites local)
              </span>
            </div>
          </Button>
        </div>
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            These operations completely replace the destination data. {storageMode === "cloud" ? "Switch to Local mode to view downloaded data." : "Switch to Cloud mode to view uploaded data."}
          </p>
        </div>
      </div>
    </>
  );
}
