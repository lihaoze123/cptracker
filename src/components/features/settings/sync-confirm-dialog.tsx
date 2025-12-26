/**
 * Sync Confirmation Dialog
 * Confirms upload/download operations
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SyncConfirmDialogProps {
  type: "upload" | "download" | null;
  isOpen: boolean;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SyncConfirmDialog({
  type,
  isOpen,
  isProcessing,
  onClose,
  onConfirm,
}: SyncConfirmDialogProps) {
  if (!type) return null;

  return (
    <>
      {type === "upload" && (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Upload Local Data to Cloud</AlertDialogTitle>
              <AlertDialogDescription>
                This will upload all your local data to the cloud. Existing cloud data will be preserved and merged.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm} disabled={isProcessing}>
                {isProcessing ? "Uploading..." : "Upload"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {type === "download" && (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Download Cloud Data</AlertDialogTitle>
              <AlertDialogDescription>
                This will replace all your local data with cloud data. Make sure your local changes are synced first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm} disabled={isProcessing}>
                {isProcessing ? "Downloading..." : "Download"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
