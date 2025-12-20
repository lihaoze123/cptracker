import { FileX2, SearchX, Plus, RotateCcw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataTableEmptyStateProps {
  isFiltered: boolean;
  onReset?: () => void;
  onAdd?: () => void;
  onLoadSample?: () => void;
}

export function DataTableEmptyState({
  isFiltered,
  onReset,
  onAdd,
  onLoadSample,
}: DataTableEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <SearchX className="size-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-base font-medium mb-1">No matching results</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Try adjusting your filters or search terms
        </p>
        {onReset && (
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="size-4" />
            Reset filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <FileX2 className="size-12 text-muted-foreground/50 mb-4" />
      <h3 className="text-base font-medium mb-1">No problems yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Start tracking your solved problems
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        {onAdd && (
          <Button variant="default" size="sm" onClick={onAdd}>
            <Plus className="size-4" />
            Add your first problem
          </Button>
        )}
        {onLoadSample && (
          <Button variant="outline" size="sm" onClick={onLoadSample}>
            <Database className="size-4" />
            Load sample data
          </Button>
        )}
      </div>
    </div>
  );
}
