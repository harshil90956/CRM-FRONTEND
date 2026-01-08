import { useEffect, useMemo, useState } from "react";

type UseClientPaginationOptions = {
  pageSize?: number;
  initialPage?: number;
};

export const useClientPagination = <T,>(items: T[], options?: UseClientPaginationOptions) => {
  const pageSize = options?.pageSize ?? 10;
  const [page, setPage] = useState(options?.initialPage ?? 1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const prev = () => setPage((p) => Math.max(1, p - 1));
  const next = () => setPage((p) => Math.min(totalPages, p + 1));

  return {
    page,
    setPage,
    pageSize,
    totalItems,
    totalPages,
    pageItems,
    canPrev,
    canNext,
    prev,
    next,
  };
};
