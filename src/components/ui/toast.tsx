import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ToastProps {
  variant?: "default" | "destructive";
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function Toast({ variant = "default", children, onOpenChange }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onOpenChange?.(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onOpenChange]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
        {
          "border-destructive bg-destructive text-destructive-foreground": variant === "destructive",
          "bg-background border": variant === "default",
        }
      )}
      data-state={isVisible ? "open" : "closed"}
    >
      <div className="grid gap-1 flex-1">{children}</div>
      <button
        onClick={() => {
          setIsVisible(false);
          onOpenChange?.(false);
        }}
        className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}

export function ToastTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold">{children}</div>;
}

export function ToastDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm opacity-90">{children}</div>;
}
