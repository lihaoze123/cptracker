import { useState } from "react";
import type { Table } from "@tanstack/react-table";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DataTableActionBarProps<TData> {
  table: Table<TData>;
  onDelete: (rows: TData[]) => Promise<void>;
}

export function DataTableActionBar<TData>({
  table,
  onDelete,
}: DataTableActionBarProps<TData>) {
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(selectedRows.map((row) => row.original));
      table.resetRowSelection();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearSelection = () => {
    table.resetRowSelection();
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 shadow-lg">
        <span className="text-sm text-muted-foreground">
          {selectedCount} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="h-8"
              disabled={isDeleting}
            >
              <Trash2 className="size-4" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedCount} problems?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                selected problems from your collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={handleClearSelection}
        >
          <X className="size-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
