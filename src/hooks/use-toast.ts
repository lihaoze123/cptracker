import { useState } from "react";

export type ToastVariant = "default" | "destructive";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToasterToast extends Toast {
  onOpenChange?: (open: boolean) => void;
}

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ToasterState = {
  toasts: ToasterToast[];
};

const listeners: Array<(state: ToasterState) => void> = [];

const memoryState: ToasterState = { toasts: [] };

function dispatch(action: { type: string; toast?: ToasterToast; toastId?: string }) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState.toasts = [action.toast!, ...memoryState.toasts].slice(0, TOAST_LIMIT);
      break;
    case "UPDATE_TOAST":
      memoryState.toasts = memoryState.toasts.map((t) =>
        t.id === action.toast!.id ? { ...t, ...action.toast } : t
      );
      break;
    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        const toast = memoryState.toasts.find((t) => t.id === toastId);
        toast?.onOpenChange?.(false);
      } else {
        memoryState.toasts.forEach((toast) => {
          toast.onOpenChange?.(false);
        });
      }

      memoryState.toasts = memoryState.toasts.map((t) =>
        t.id === toastId || toastId === undefined
          ? {
              ...t,
              onOpenChange: (open: boolean) => {
                if (!open) {
                  setTimeout(() => {
                    dispatch({ type: "REMOVE_TOAST", toastId: t.id });
                  }, TOAST_REMOVE_DELAY);
                }
              },
            }
          : t
      );
      break;
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        memoryState.toasts = [];
      } else {
        memoryState.toasts = memoryState.toasts.filter((t) => t.id !== action.toastId);
      }
      break;
  }

  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast({ title, description, variant = "default" }: Omit<ToasterToast, "id">) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      id,
      title,
      description,
      variant,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = useState<ToasterState>(memoryState);

  useState(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  });

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
