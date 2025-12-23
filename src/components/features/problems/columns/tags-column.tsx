/**
 * Tags Column Component
 * Displays problem tags with clickable filter
 */
import { memo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Row } from "@tanstack/react-table";
import type { SolvedProblem } from "@/data/mock";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Tags, Star } from "lucide-react";

interface TagBadgeProps {
  tag: string;
  isFavorited?: boolean;
  onClick: (e: React.MouseEvent) => void;
}

const TagBadge = memo(function TagBadge({ tag, isFavorited, onClick }: TagBadgeProps) {
  if (isFavorited) {
    return (
      <Badge
        className="text-xs cursor-pointer bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700 dark:hover:bg-yellow-900/50 transition-colors"
        onClick={onClick}
      >
        <Star className="size-3 fill-current" />
        {tag}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="text-xs cursor-pointer hover:bg-accent transition-colors"
      onClick={onClick}
    >
      {tag}
    </Badge>
  );
});

function handleTagClick(e: React.MouseEvent, table: any, tag: string) {
  e.stopPropagation();
  const tagsColumn = table.getColumn("tags");
  if (tagsColumn) {
    const currentFilter = (tagsColumn.getFilterValue() as string) || "";
    const existingTags = currentFilter
      .split(/[,\s]+/)
      .map((t: string) => t.trim())
      .filter(Boolean);
    if (!existingTags.includes(tag)) {
      const newFilter = currentFilter ? `${currentFilter}, ${tag}` : tag;
      tagsColumn.setFilterValue(newFilter);
    }
  }
}

export function TagsColumn(): ColumnDef<SolvedProblem> {
  return {
    id: "tags",
    accessorKey: "关键词",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Tags" />
    ),
    cell: ({ row, table }) => {
      const tags = ProblemService.parseTagString(row.getValue<string>("tags"));
      const isFavorited = tags.some((t) => t.toLowerCase() === "favorited");
      const displayTags = tags.filter((t) => t.toLowerCase() !== "favorited");

      return (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {isFavorited && (
            <TagBadge
              tag="favorited"
              isFavorited
              onClick={(e) => handleTagClick(e, table, "favorited")}
            />
          )}
          {displayTags.map((tag, i) => (
            <TagBadge
              key={i}
              tag={tag}
              onClick={(e) => handleTagClick(e, table, tag)}
            />
          ))}
        </div>
      );
    },
    filterFn: (row: Row<SolvedProblem>, _id: string, filterValue: string) => {
      if (!filterValue) return true;
      const tags = row.original.关键词.toLowerCase();
      const searchTerms = filterValue
        .toLowerCase()
        .split(/[,\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);

      return searchTerms.every((term) => tags.includes(term));
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
  };
}
