/**
 * Solution Column Component
 * Displays solution link/dialog
 */
import type { ColumnDef } from "@tanstack/react-table";
import type { SolvedProblem } from "@/data/mock";
import { SolutionDialog } from "@/components/solution-dialog";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { extractProblemInfo } from "@/lib/problem-utils";

export function SolutionColumn(ownerUsername?: string): ColumnDef<SolvedProblem> {
  return {
    id: "solution",
    accessorKey: "题解",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Solution" />
    ),
    cell: ({ row }) => {
      const solution = row.getValue<string>("solution");
      const problemName = extractProblemInfo(row.original.题目).name;
      const solutionId = row.original.supabase_id || String(row.original.id);
      return (
        <SolutionDialog
          solution={solution}
          problemName={problemName}
          solutionId={solutionId}
          ownerUsername={ownerUsername}
        />
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  };
}
