/**
 * Account Section Component
 * Displays user account info and sign out button
 */
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Info, ExternalLink } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { useAuthStore } from "@/stores/auth-store";

export function AccountSection() {
  const { user, signOut, setStorageMode } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    setStorageMode("local");
  };

  return (
    <>
      <div className="space-y-3">
        <Label className="text-base font-semibold">Account</Label>
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <UserAvatar email={user?.email} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Signed in</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your avatar is linked to your email via Gravatar. Set up your avatar at gravatar.com.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              asChild
            >
              <a
                href="https://gravatar.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Set up Gravatar
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      <Separator />
    </>
  );
}
