/**
 * Problem Column Component
 * Displays the problem ID/name with link or dialog
 */
import type { ColumnDef } from "@tanstack/react-table";
import type { Row } from "@tanstack/react-table";
import type { SolvedProblem } from "@/data/mock";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { ProblemTextDialog } from "@/components/problem-text-dialog";
import { FileText } from "lucide-react";
import { extractProblemInfo, extractURLFromText } from "@/lib/problem-utils";

export function ProblemColumn(): ColumnDef<SolvedProblem> {
  return {
    id: "problem",
    accessorFn: (row) => extractProblemInfo(row.题目).name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Problem" />
    ),
    cell: ({ row }) => {
      const { name, isURL } = extractProblemInfo(row.original.题目);

      if (isURL) {
        const url = extractURLFromText(row.original.题目);
        return (
          <a
            href={url || row.original.题目}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline font-mono text-sm"
          >
            {name}
          </a>
        );
      }

      return <ProblemTextDialog text={row.original.题目} />;
    },
    filterFn: (row: Row<SolvedProblem>, _id: string, filterValue: string) => {
      if (!filterValue) return true;
      const name = extractProblemInfo(row.original.题目).name.toLowerCase();
      return name.includes(filterValue.toLowerCase());
    },
    meta: {
      label: "Problem",
      placeholder: "Search problem ID...",
      variant: "text",
      icon: FileText,
    },
    enableColumnFilter: true,
    enableSorting: true,
  };
}
