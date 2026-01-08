import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationBarProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export const PaginationBar = ({ page, totalPages, onPageChange, className }: PaginationBarProps) => {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-border", className)}>
      <span className="text-sm text-muted-foreground">Page {page} of {safeTotalPages}</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
