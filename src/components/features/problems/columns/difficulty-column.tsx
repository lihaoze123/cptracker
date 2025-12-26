/**
 * Difficulty Column Component
 * Displays the problem difficulty rating
 */
import type { ColumnDef } from "@tanstack/react-table";
import type { Row } from "@tanstack/react-table";
import type { SolvedProblem } from "@/data/mock";
import { RatingBadge } from "@/components/rating-badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Hash } from "lucide-react";

export function DifficultyColumn(): ColumnDef<SolvedProblem> {
  return {
    id: "difficulty",
    accessorKey: "难度",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Difficulty" />
    ),
    cell: ({ row }) => <RatingBadge rating={row.getValue("difficulty")} />,
    filterFn: (row: Row<SolvedProblem>, _id: string, filterValue: [number, number]) => {
      if (!filterValue || filterValue.length !== 2) return true;
      if (!row.original.难度) return false;
      const difficulty = parseInt(row.original.难度);
      return difficulty >= filterValue[0] && difficulty <= filterValue[1];
    },
    meta: {
      label: "Difficulty",
      variant: "range",
      range: [1000, 3000],
      icon: Hash,
      filterClassName: "hidden md:flex",
    },
    enableColumnFilter: true,
    enableSorting: true,
  };
}
