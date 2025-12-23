/**
 * Source Column Component
 * Displays the problem source OJ badge
 */
import type { ColumnDef } from "@tanstack/react-table";
import type { Row } from "@tanstack/react-table";
import type { SolvedProblem } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Link as LinkIcon } from "lucide-react";
import { extractProblemInfo } from "@/lib/problem-utils";

export function SourceColumn(): ColumnDef<SolvedProblem> {
  return {
    id: "source",
    accessorFn: (row) => extractProblemInfo(row.题目).source,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Source" />
    ),
    cell: ({ row }) => {
      const source = extractProblemInfo(row.original.题目).source;
      return <Badge variant="secondary">{source}</Badge>;
    },
    filterFn: (row: Row<SolvedProblem>, _id: string, filterValue: string[]) => {
      if (!filterValue || filterValue.length === 0) return true;
      const source = extractProblemInfo(row.original.题目).source;
      return filterValue.includes(source);
    },
    meta: {
      label: "Source",
      variant: "multiSelect",
      options: [
        { label: "Codeforces", value: "Codeforces" },
        { label: "AtCoder", value: "AtCoder" },
        { label: "LeetCode", value: "LeetCode" },
        { label: "Nowcoder", value: "Nowcoder" },
        { label: "Luogu", value: "Luogu" },
        { label: "Vjudge", value: "Vjudge" },
        { label: "QOJ", value: "QOJ" },
      ],
      icon: LinkIcon,
      className: "hidden md:table-cell",
      filterClassName: "hidden md:flex",
    },
    enableColumnFilter: true,
    enableSorting: true,
  };
}
