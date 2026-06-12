import React from "react";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
};

export function Pagination({
  page,
  totalPages,
  totalItems,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Build page number list with ellipsis
  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex items-center justify-between mt-6 px-1">
      {/* Left: item count */}
      <p className="font-body text-xs text-swansons-muted">
        Page <span className="font-semibold text-swansons-navy">{page}</span> of{" "}
        <span className="font-semibold text-swansons-navy">{totalPages}</span>
        <span className="ml-2 text-swansons-muted/70">
          ({totalItems} total)
        </span>
      </p>

      {/* Right: controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-swansons-navy text-swansons-navy disabled:opacity-30 disabled:cursor-not-allowed hover:bg-swansons-navy hover:text-white transition"
          aria-label="Previous page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Page numbers */}
        {pages.map((p, i) =>
          p === "..." ? (
            <span
              key={`ellipsis-${i}`}
              className="w-8 h-8 flex items-center justify-center font-body text-xs text-swansons-muted"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p as number)}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-body text-xs font-semibold transition ${
                page === p
                  ? "bg-swansons-navy text-white"
                  : "border-2 border-swansons-navy text-swansons-navy hover:bg-swansons-navy hover:text-white"
              }`}
              aria-current={page === p ? "page" : undefined}
            >
              {p}
            </button>
          ),
        )}

        {/* Next */}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-swansons-navy text-swansons-navy disabled:opacity-30 disabled:cursor-not-allowed hover:bg-swansons-navy hover:text-white transition"
          aria-label="Next page"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");
  pages.push(total);

  return pages;
}
