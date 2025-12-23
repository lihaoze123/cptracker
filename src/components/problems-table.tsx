/**
 * Problems Table Component
 * Main data table component with filtering, sorting, and pagination
 */
import { useState, useEffect, useCallback } from "react";
import type { SortingState, ColumnFiltersState, VisibilityState, RowSelectionState } from "@tanstack/react-table";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/react-table";
import type { SolvedProblem } from "@/data/mock";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableEmptyState } from "@/components/data-table/data-table-empty-state";
import { DataTableActionBar } from "@/components/data-table/data-table-action-bar";
import { AddProblemSheet } from "@/components/add-problem-sheet";
import { EditProblemSheet } from "@/components/edit-problem-sheet";
import { useProblemColumns } from "./features/problems/hooks/use-problem-columns";
import { useProblems } from "@/hooks/use-problems-queries";

interface ProblemsTableProps {
  problems: SolvedProblem[];
  onFilteredDataChange?: (filteredProblems: SolvedProblem[]) => void;
  onAddProblem?: (problem: Omit<SolvedProblem, "id">) => Promise<boolean>;
  onEditProblem?: (id: number, changes: Partial<SolvedProblem>) => Promise<boolean>;
  readOnly?: boolean;
  ownerUsername?: string;
}

export function ProblemsTable({
  problems,
  onFilteredDataChange,
  onAddProblem,
  onEditProblem,
  readOnly = false,
  ownerUsername,
}: ProblemsTableProps) {
  const [editingProblem, setEditingProblem] = useState<SolvedProblem | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const { deleteProblems, resetToMockData } = useProblems();

  const handleEditClick = useCallback((problem: SolvedProblem) => {
    setEditingProblem(problem);
    setEditSheetOpen(true);
  }, []);

  const columns = useProblemColumns({
    readOnly,
    onEdit: handleEditClick,
    ownerUsername,
  });

  const handleBulkDelete = useCallback(
    async (rows: SolvedProblem[]) => {
      const ids = rows.map((row) => row.id);
      await deleteProblems(ids);
    },
    [deleteProblems]
  );

  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data: problems,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: !readOnly,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: (row) => String(row.id),
  });

  // Notify parent component when filtered data changes
  useEffect(() => {
    if (onFilteredDataChange) {
      const filteredRows = table.getFilteredRowModel().rows;
      const filteredData = filteredRows.map((row) => row.original);
      onFilteredDataChange(filteredData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters, sorting, problems]);

  const isFiltered = columnFilters.length > 0;

  const handleResetFilters = () => {
    setColumnFilters([]);
  };

  const handleOpenAddSheet = () => {
    setAddSheetOpen(true);
  };

  return (
    <>
      <DataTable
        table={table}
        emptyState={
          <DataTableEmptyState
            isFiltered={isFiltered}
            onReset={handleResetFilters}
            onAdd={!readOnly && onAddProblem ? handleOpenAddSheet : undefined}
            onLoadSample={!readOnly ? resetToMockData : undefined}
          />
        }
        actionBar={
          !readOnly && (
            <DataTableActionBar table={table} onDelete={handleBulkDelete} />
          )
        }
      >
        <DataTableToolbar table={table}>
          {!readOnly && onAddProblem && (
            <AddProblemSheet
              onAdd={onAddProblem}
              open={addSheetOpen}
              onOpenChange={setAddSheetOpen}
            />
          )}
        </DataTableToolbar>
      </DataTable>
      {!readOnly && onEditProblem && (
        <EditProblemSheet
          problem={editingProblem}
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          onEdit={onEditProblem}
        />
      )}
    </>
  );
}
