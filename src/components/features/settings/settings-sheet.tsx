/**
 * Main Settings Sheet Component
 * Orchestrates all settings sections
 */
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { StorageModeSection } from "./storage-mode-section";
import { AccountSection } from "./account-section";
import { ProfileSection } from "./profile-section";
import { DataTransferSection } from "./data-transfer-section";
import { LoginPromptDialog } from "./login-prompt-dialog";
import { SyncConfirmDialog } from "./sync-confirm-dialog";

interface SettingsSheetProps {
  onUploadToCloud?: () => Promise<boolean>;
  onDownloadFromCloud?: () => Promise<boolean>;
  isSyncing?: boolean;
}

export function SettingsSheet({
  onUploadToCloud,
  onDownloadFromCloud,
  isSyncing = false,
}: SettingsSheetProps) {
  const { user } = useAuthStore();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState<"upload" | "download" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[400px] sm:w-[540px] px-6 flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </SheetTitle>
            <SheetDescription>
              Manage your storage preferences and account
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6 overflow-y-auto flex-1">
            <StorageModeSection onLoginRequired={() => setShowLoginPrompt(true)} />

            {user && (
              <>
                <AccountSection />
                <ProfileSection />
                <DataTransferSection
                  onUploadClick={() => setShowSyncDialog("upload")}
                  onDownloadClick={() => setShowSyncDialog("download")}
                  isSyncing={isSyncing}
                />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />

      <SyncConfirmDialog
        type={showSyncDialog}
        isOpen={showSyncDialog !== null}
        isProcessing={isProcessing}
        onClose={() => setShowSyncDialog(null)}
        onConfirm={async () => {
          if (!showSyncDialog) return;
          setIsProcessing(true);
          if (showSyncDialog === "upload" && onUploadToCloud) {
            await onUploadToCloud();
          } else if (showSyncDialog === "download" && onDownloadFromCloud) {
            await onDownloadFromCloud();
          }
          setIsProcessing(false);
          setShowSyncDialog(null);
        }}
      />
    </>
  );
}
