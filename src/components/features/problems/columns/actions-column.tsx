/**
 * Actions Column Component
 * Edit button for problem rows
 */
import type { ColumnDef } from "@tanstack/react-table";
import type { SolvedProblem } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export function ActionsColumn(onEdit: (problem: SolvedProblem) => void): ColumnDef<SolvedProblem> {
  return {
    id: "actions",
    size: 40,
    header: () => null,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        className="size-9 sm:size-7 text-muted-foreground hover:text-foreground"
        onClick={() => onEdit(row.original)}
      >
        <Pencil className="size-4 sm:size-3.5" />
        <span className="sr-only">Edit</span>
      </Button>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  };
}
