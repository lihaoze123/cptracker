/**
 * Name Column Component
 * Displays the problem name (optional field)
 */
import type { ColumnDef } from "@tanstack/react-table";
import type { Row } from "@tanstack/react-table";
import type { SolvedProblem } from "@/data/mock";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { FileText } from "lucide-react";

export function NameColumn(): ColumnDef<SolvedProblem> {
  return {
    id: "name",
    accessorKey: "题目名称",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue<string | undefined>("name");
      return name ? (
        <span className="text-sm">{name}</span>
      ) : (
        <span className="text-muted-foreground text-xs italic">-</span>
      );
    },
    filterFn: (row: Row<SolvedProblem>, _id: string, filterValue: string) => {
      if (!filterValue) return true;
      const name = row.original.题目名称?.toLowerCase() || "";
      return name.includes(filterValue.toLowerCase());
    },
    meta: {
      label: "Name",
      placeholder: "Search problem name...",
      variant: "text",
      icon: FileText,
      className: "hidden lg:table-cell",
      filterClassName: "hidden lg:flex",
    },
    enableColumnFilter: true,
    enableSorting: true,
  };
}
