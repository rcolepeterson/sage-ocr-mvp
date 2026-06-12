import { useState, useEffect, useMemo } from "react";

const PAGE_SIZE = 10;

export function usePagination<T>(items: T[], resetDeps: unknown[] = []) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever filters/search/sort change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetDeps);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  // Clamp page if items shrink (e.g. filter removes results)
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(
    () => items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [items, safePage],
  );

  return {
    paged, // the slice to render
    page: safePage,
    totalPages,
    totalItems: items.length,
    setPage,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    prev: () => setPage((p) => Math.max(1, p - 1)),
    next: () => setPage((p) => Math.min(totalPages, p + 1)),
  };
}
