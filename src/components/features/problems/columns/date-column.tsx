/**
 * Date Column Component
 * Displays the problem AC date
 */
import type { ColumnDef } from "@tanstack/react-table";
import type { Row } from "@tanstack/react-table";
import type { SolvedProblem } from "@/data/mock";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Calendar } from "lucide-react";
import { formatTimestamp } from "@/services/date-service";

export function DateColumn(): ColumnDef<SolvedProblem> {
  return {
    id: "date",
    accessorKey: "日期",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="AC Time" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatTimestamp(row.getValue("date"), "zh-CN", true)}
      </span>
    ),
    filterFn: (row: Row<SolvedProblem>, _id: string, filterValue: Date | [Date, Date]) => {
      if (!filterValue) return true;
      const rowDate = new Date(row.original.日期);

      if (Array.isArray(filterValue)) {
        const [start, end] = filterValue;
        return rowDate >= start && rowDate <= end;
      } else {
        const filterDate = new Date(filterValue);
        return rowDate.toDateString() === filterDate.toDateString();
      }
    },
    meta: {
      label: "AC Time",
      variant: "dateRange",
      icon: Calendar,
      className: "hidden md:table-cell",
      filterClassName: "hidden md:flex",
    },
    enableColumnFilter: true,
    enableSorting: true,
  };
}
