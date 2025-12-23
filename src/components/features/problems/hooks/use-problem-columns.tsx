/**
 * Problem Table Columns Hook
 * Assembles and memoizes table column definitions
 */
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { SolvedProblem } from "@/data/mock";
import { Checkbox } from "@/components/ui/checkbox";
import { SourceColumn } from "../columns/source-column";
import { ProblemColumn } from "../columns/problem-column";
import { NameColumn } from "../columns/name-column";
import { DifficultyColumn } from "../columns/difficulty-column";
import { TagsColumn } from "../columns/tags-column";
import { SolutionColumn } from "../columns/solution-column";
import { DateColumn } from "../columns/date-column";
import { ActionsColumn } from "../columns/actions-column";

interface UseProblemColumnsOptions {
  readOnly?: boolean;
  onEdit?: (problem: SolvedProblem) => void;
  ownerUsername?: string;
}

export function useProblemColumns({
  readOnly = false,
  onEdit,
  ownerUsername,
}: UseProblemColumnsOptions = {}) {
  return useMemo<ColumnDef<SolvedProblem>[]>(() => {
    const columns: ColumnDef<SolvedProblem>[] = [];

    // Add select column only if not in read-only mode
    if (!readOnly) {
      columns.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-0.5"
          />
        ),
        size: 40,
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
      });
    }

    // Add data columns
    columns.push(
      SourceColumn(),
      ProblemColumn(),
      NameColumn(),
      DifficultyColumn(),
      TagsColumn(),
      SolutionColumn(ownerUsername),
      DateColumn()
    );

    // Add actions column only if not in read-only mode
    if (!readOnly && onEdit) {
      columns.push(ActionsColumn(onEdit));
    }

    return columns;
  }, [readOnly, onEdit, ownerUsername]);
}
