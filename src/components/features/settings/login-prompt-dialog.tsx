/**
 * Login Prompt Dialog
 * Shown when user tries to enable cloud sync without being logged in
 */
import { Link } from "@tanstack/react-router";
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

interface LoginPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginPromptDialog({ open, onOpenChange }: LoginPromptDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            <Link to="/auth" search={{ view: "login" }}>Sign In</Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
