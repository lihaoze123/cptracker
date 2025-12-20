import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Settings,
  Cloud,
  HardDrive,
  Upload,
  Download,
  LogOut,
  Info,
  Globe,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { getEmailHash } from "@/lib/gravatar";
import { useAuth } from "@/contexts/auth-context";
import type { StorageMode } from "@/lib/storage-mode";
import { fetchAllProblems } from "@/lib/supabase/database";
import { getCurrentUserProfile, updateProfile, isUsernameAvailable, type UserProfile } from "@/lib/supabase/profiles";
import { useToast } from "@/hooks/use-toast";

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
  const { user, storageMode, setStorageMode, signOut } = useAuth();
  const { toast } = useToast();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState<"upload" | "download" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cloudProblemCount, setCloudProblemCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Profile management
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedDisplayName, setEditedDisplayName] = useState("");
  const [editedIsPublic, setEditedIsPublic] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // 获取用户资料
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

  // 获取云端题目数量
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

  const handleStorageModeChange = (value: StorageMode) => {
    if (value === "cloud" && !user) {
      setShowLoginPrompt(true);
      return;
    }
    setStorageMode(value);
  };

  const handleUpload = async () => {
    if (!onUploadToCloud) return;
    setIsProcessing(true);
    const success = await onUploadToCloud();
    setIsProcessing(false);
    setShowSyncDialog(null);

    // 刷新云端题目数量
    if (success && user) {
      setIsLoadingCount(true);
      try {
        const problems = await fetchAllProblems();
        setCloudProblemCount(problems.length);
      } catch (error) {
        console.error("Failed to refresh cloud problem count:", error);
      } finally {
        setIsLoadingCount(false);
      }
    }
  };

  const handleDownload = async () => {
    if (!onDownloadFromCloud) return;
    setIsProcessing(true);
    await onDownloadFromCloud();
    setIsProcessing(false);
    setShowSyncDialog(null);
  };

  const handleSignOut = async () => {
    await signOut();
    setStorageMode("local");
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    // 验证 username
    const trimmedUsername = editedUsername.trim();
    if (!trimmedUsername) {
      toast({
        title: "Invalid username",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    // 检查 username 格式（只允许字母、数字、下划线、连字符）
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
      // 如果 username 改变了，检查是否可用
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

      // 更新资料（包括 avatar_hash）
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
            {/* 存储模式选择 */}
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

            {/* 账户信息 */}
            {user && (
              <>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Account</Label>
                  <div className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar email={user.email} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.email}</p>
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
            )}

            {/* 公开资料设置 */}
            {user && isLoadingProfile && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Public Profile</Label>
                <div className="rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">
                  Loading profile...
                </div>
              </div>
            )}

            {user && !isLoadingProfile && !profile && (
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
            )}

            {user && profile && !isLoadingProfile && (
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
            )}

            {/* 云端数据信息 */}
            {user && (
              <>
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
              </>
            )}

            {/* 数据传输操作 */}
            {user && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Data Transfer</Label>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => setShowSyncDialog("upload")}
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
                    onClick={() => setShowSyncDialog("download")}
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
            )}

            {/* 未登录时的云端选项 */}
            {storageMode === "local" && !user && (
              <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center space-y-3">
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Cloud className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Enable Cloud Sync</p>
                  <p className="text-xs text-muted-foreground">
                    Sign in to sync your data across all your devices and never lose your progress
                  </p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 登录提示对话框 */}
      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign In Required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to sign in to enable cloud sync. Would you like to sign in now?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <a href="#login">Sign In</a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 上传确认对话框 */}
      <AlertDialog
        open={showSyncDialog === "upload"}
        onOpenChange={(open) => !open && setShowSyncDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload Local Data to Cloud</AlertDialogTitle>
            <AlertDialogDescription>
              This will upload all your local data to the cloud. Existing cloud data will be preserved and merged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpload} disabled={isProcessing}>
              {isProcessing ? "Uploading..." : "Upload"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 下载确认对话框 */}
      <AlertDialog
        open={showSyncDialog === "download"}
        onOpenChange={(open) => !open && setShowSyncDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Download Cloud Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all your local data with cloud data. Make sure your local changes are synced first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDownload} disabled={isProcessing}>
              {isProcessing ? "Downloading..." : "Download"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
