/**
 * Public Profile Section Component
 * Handles viewing and editing public profile
 */
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Globe, Info, Copy, Check } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { getCurrentUserProfile, updateProfile, isUsernameAvailable, type UserProfile } from "@/lib/supabase/profiles";
import { getEmailHash } from "@/lib/gravatar";
import { useToast } from "@/hooks/use-toast";

export function ProfileSection() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedDisplayName, setEditedDisplayName] = useState("");
  const [editedIsPublic, setEditedIsPublic] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setIsLoadingProfile(true);
        try {
          const userProfile = await getCurrentUserProfile();
          setProfile(userProfile);
          if (userProfile) {
            setEditedUsername(userProfile.username);
            setEditedDisplayName(userProfile.display_name || "");
            setEditedIsPublic(userProfile.is_public);
          }
        } catch (error) {
          console.error("Failed to fetch profile:", error);
        } finally {
          setIsLoadingProfile(false);
        }
      } else {
        setProfile(null);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!profile) return;

    const trimmedUsername = editedUsername.trim();
    if (!trimmedUsername) {
      toast({
        title: "Invalid username",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      toast({
        title: "Invalid username",
        description: "Username can only contain letters, numbers, underscores, and hyphens",
        variant: "destructive",
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      if (trimmedUsername !== profile.username) {
        const available = await isUsernameAvailable(trimmedUsername);
        if (!available) {
          toast({
            title: "Username taken",
            description: "This username is already taken. Please choose another one.",
            variant: "destructive",
          });
          setIsSavingProfile(false);
          return;
        }
      }

      const trimmedDisplayName = editedDisplayName.trim();
      const avatarHash = user?.email ? getEmailHash(user.email) : undefined;
      const updatedProfile = await updateProfile({
        username: trimmedUsername,
        display_name: trimmedDisplayName || undefined,
        is_public: editedIsPublic,
        avatar_hash: avatarHash,
      });

      setProfile(updatedProfile);
      setIsEditingProfile(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditedUsername(profile.username);
      setEditedDisplayName(profile.display_name || "");
      setEditedIsPublic(profile.is_public);
    }
    setIsEditingProfile(false);
  };

  const handleCopyProfileUrl = () => {
    if (profile) {
      const url = `${window.location.origin}/${profile.username}`;
      navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      toast({
        title: "Copied!",
        description: "Profile URL copied to clipboard",
      });
    }
  };

  // Loading state
  if (isLoadingProfile) {
    return (
      <>
        <div className="space-y-3">
          <Label className="text-base font-semibold">Public Profile</Label>
          <div className="rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">
            Loading profile...
          </div>
        </div>
        <Separator />
      </>
    );
  }

  // Profile not found
  if (!profile) {
    return (
      <>
        <div className="space-y-3">
          <Label className="text-base font-semibold">Public Profile</Label>
          <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Profile not found. Please make sure the database schema is set up correctly.
            </p>
            <p className="text-xs text-muted-foreground">
              Run the SQL schema in supabase/schema.sql
            </p>
          </div>
        </div>
        <Separator />
      </>
    );
  }

  // Profile view/edit
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Public Profile</Label>
          {profile.is_public && (
            <Badge variant="default" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
          )}
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-4">
          {!isEditingProfile ? (
            <>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Username</p>
                  <p className="text-sm font-medium">@{profile.username}</p>
                </div>
                {profile.display_name && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Display Name</p>
                    <p className="text-sm font-medium">{profile.display_name}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Public Access</p>
                    <p className="text-sm">{profile.is_public ? "Enabled" : "Disabled"}</p>
                  </div>
                </div>
              </div>

              {profile.is_public && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Your public profile URL:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-2 py-1.5 rounded overflow-x-auto">
                      {window.location.origin}/{profile.username}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0"
                      onClick={handleCopyProfileUrl}
                    >
                      {copiedUrl ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
                className="w-full"
              >
                Edit Profile
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm">Username</Label>
                  <Input
                    id="username"
                    value={editedUsername}
                    onChange={(e) => setEditedUsername(e.target.value)}
                    placeholder="username"
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">
                    Letters, numbers, underscores, and hyphens only
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm">Display Name (optional)</Label>
                  <Input
                    id="displayName"
                    value={editedDisplayName}
                    onChange={(e) => setEditedDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="h-9"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="isPublic" className="text-sm">Public Profile</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow others to view your problems
                    </p>
                  </div>
                  <Switch
                    id="isPublic"
                    checked={editedIsPublic}
                    onCheckedChange={setEditedIsPublic}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSavingProfile}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex-1"
                >
                  {isSavingProfile ? "Saving..." : "Save"}
                </Button>
              </div>
            </>
          )}
        </div>

        {!isEditingProfile && (
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {profile.is_public
                ? "Your profile is public. Anyone with your profile URL can view your problems."
                : "Your profile is private. Enable public access to share your problems with others."}
            </p>
          </div>
        )}
      </div>
      <Separator />
    </>
  );
}
