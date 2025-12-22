import { useMemo, useState, useEffect, useCallback } from "react";
import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState, Row, RowSelectionState } from "@tanstack/react-table";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RatingBadge } from "@/components/rating-badge";
import { SolutionDialog } from "@/components/solution-dialog";
import { ProblemTextDialog } from "@/components/problem-text-dialog";
import type { SolvedProblem } from "@/data/mock";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { DataTableEmptyState } from "@/components/data-table/data-table-empty-state";
import { DataTableActionBar } from "@/components/data-table/data-table-action-bar";
import { AddProblemSheet } from "@/components/add-problem-sheet";
import { EditProblemSheet } from "@/components/edit-problem-sheet";
import { Button } from "@/components/ui/button";
import { Calendar, Hash, FileText, Link as LinkIcon, Tags, Star, Pencil } from "lucide-react";
import { useProblems } from "@/hooks/use-problems-queries";
import { extractURLFromText, extractProblemInfo } from "@/lib/problem-utils";

interface ProblemsTableProps {
  problems: SolvedProblem[];
  onFilteredDataChange?: (filteredProblems: SolvedProblem[]) => void;
  onAddProblem?: (problem: Omit<SolvedProblem, "id">) => Promise<boolean>;
  onEditProblem?: (id: number, changes: Partial<SolvedProblem>) => Promise<boolean>;
  readOnly?: boolean;
  ownerUsername?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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

  const handleEditClick = (problem: SolvedProblem) => {
    setEditingProblem(problem);
    setEditSheetOpen(true);
  };

  const handleBulkDelete = useCallback(
    async (rows: SolvedProblem[]) => {
      const ids = rows.map((row) => row.id);
      await deleteProblems(ids);
    },
    [deleteProblems]
  );

  const columns = useMemo<ColumnDef<SolvedProblem>[]>(
    () => {
      const baseColumns: ColumnDef<SolvedProblem>[] = [];

      // Add select column only if not in read-only mode
      if (!readOnly) {
        baseColumns.push({
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

      baseColumns.push({
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
          ],
          icon: LinkIcon,
          className: "hidden md:table-cell",
          filterClassName: "hidden md:flex",
        },
        enableColumnFilter: true,
        enableSorting: true,
      },
      {
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
      },
      {
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
      },
      {
        id: "difficulty",
        accessorKey: "难度",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Difficulty" />
        ),
        cell: ({ row }) => <RatingBadge rating={row.getValue("difficulty")} />,
        filterFn: (row: Row<SolvedProblem>, _id: string, filterValue: [number, number]) => {
          if (!filterValue || filterValue.length !== 2) return true;
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
      },
      {
        id: "tags",
        accessorKey: "关键词",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="Tags" />
        ),
        cell: ({ row, table }) => {
          const tags = row
            .getValue<string>("tags")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
          const isFavorited = tags.some((t) => t.toLowerCase() === "favorited");
          const displayTags = tags.filter((t) => t.toLowerCase() !== "favorited");
          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {isFavorited && (
                <Badge
                  className="text-xs cursor-pointer bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700 dark:hover:bg-yellow-900/50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const tagsColumn = table.getColumn("tags");
                    if (tagsColumn) {
                      const currentFilter = (tagsColumn.getFilterValue() as string) || "";
                      const existingTags = currentFilter
                        .split(/[,\s]+/)
                        .map((t) => t.trim())
                        .filter(Boolean);
                      if (!existingTags.includes("favorited")) {
                        const newFilter = currentFilter ? `${currentFilter}, favorited` : "favorited";
                        tagsColumn.setFilterValue(newFilter);
                      }
                    }
                  }}
                >
                  <Star className="size-3 fill-current" />
                  favorited
                </Badge>
              )}
              {displayTags.map((tag, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-accent transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const tagsColumn = table.getColumn("tags");
                    if (tagsColumn) {
                      const currentFilter = (tagsColumn.getFilterValue() as string) || "";
                      const existingTags = currentFilter
                        .split(/[,\s]+/)
                        .map((t) => t.trim())
                        .filter(Boolean);
                      if (!existingTags.includes(tag)) {
                        const newFilter = currentFilter ? `${currentFilter}, ${tag}` : tag;
                        tagsColumn.setFilterValue(newFilter);
                      }
                    }
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          );
        },
        filterFn: (row: Row<SolvedProblem>, _id: string, filterValue: string) => {
          if (!filterValue) return true;
          const tags = row.original.关键词.toLowerCase();
          // 支持搜索多个 tags，用逗号或空格分隔
          const searchTerms = filterValue
            .toLowerCase()
            .split(/[,\s]+/)
            .map(t => t.trim())
            .filter(Boolean);

          // 所有搜索词都必须在 tags 中找到
          return searchTerms.every(term => tags.includes(term));
        },
        meta: {
          label: "Tags",
          placeholder: "Search tags (comma/space separated)...",
          variant: "text",
          icon: Tags,
          className: "hidden md:table-cell",
          filterClassName: "hidden md:flex",
        },
        enableColumnFilter: true,
        enableSorting: false,
      },
      {
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
      },
      {
        id: "date",
        accessorKey: "日期",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} label="AC Time" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatDate(row.getValue("date"))}
          </span>
        ),
        filterFn: (row: Row<SolvedProblem>, _id: string, filterValue: Date | [Date, Date]) => {
          if (!filterValue) return true;
          const rowDate = new Date(row.original.日期);

          if (Array.isArray(filterValue)) {
            // Date range
            const [start, end] = filterValue;
            return rowDate >= start && rowDate <= end;
          } else {
            // Single date
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
      });

    // Add actions column only if not in read-only mode
    if (!readOnly) {
      baseColumns.push({
        id: "actions",
        size: 40,
        header: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 sm:size-7 text-muted-foreground hover:text-foreground"
            onClick={() => handleEditClick(row.original)}
          >
            <Pencil className="size-4 sm:size-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      });
    }

    return baseColumns;
    },
    [readOnly, ownerUsername]
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
