import { useMemo, useCallback } from "react";

/**
 * Generates an array of page numbers and ellipsis markers for pagination.
 *
 * @param currentPage - The currently active page (1-indexed)
 * @param totalPages - The total number of pages
 * @param siblingCount - Number of pages to show on each side of the current page
 * @returns Array of page numbers and '...' ellipsis markers
 *
 * @example
 * usePagination(5, 20, 1) // [1, '...', 4, 5, 6, '...', 20]
 */
export function usePagination(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): (number | string)[] {
  return useMemo(() => {
    const totalNumbers = siblingCount * 2 + 3;
    const totalBlocks = totalNumbers + 2;

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, "...", ...middleRange, "...", totalPages];
    }

    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [currentPage, totalPages, siblingCount]);
}

interface PaginationProps {
  /** The currently active page (1-indexed) */
  currentPage: number;
  /** The total number of pages */
  totalPages: number;
  /** Callback fired when a page is selected */
  onPageChange: (page: number) => void;
  /** Number of page buttons to show on each side of the current page */
  siblingCount?: number;
}

const baseButtonClass =
  "flex h-10 min-w-10 items-center justify-center rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900";

const activeButtonClass = "bg-blue-600 text-white hover:bg-blue-700";
const disabledButtonClass = "bg-gray-800 text-gray-600 cursor-not-allowed";
const defaultButtonClass = "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white";

/**
 * Pagination component with smart ellipsis, keyboard navigation, and dark theme styling.
 *
 * @example
 * <Pagination
 *   currentPage={5}
 *   totalPages={20}
 *   onPageChange={(page) => console.log(page)}
 *   siblingCount={1}
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  const pages = usePagination(currentPage, totalPages, siblingCount);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft" && currentPage > 1) {
        onPageChange(currentPage - 1);
      } else if (e.key === "ArrowRight" && currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    },
    [currentPage, totalPages, onPageChange]
  );

  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-center gap-1"
      role="navigation"
      aria-label="Pagination"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="Go to first page"
        className={`${baseButtonClass} ${currentPage === 1 ? disabledButtonClass : defaultButtonClass}`}
      >
        {"<<"}
      </button>

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
        className={`${baseButtonClass} ${currentPage === 1 ? disabledButtonClass : defaultButtonClass}`}
      >
        {"<"}
      </button>

      {pages.map((page) => {
        const isEllipsis = page === "...";
        const isActive = page === currentPage;

        if (isEllipsis) {
          return (
            <span
              key={page}
              className="flex h-10 w-10 items-center justify-center text-gray-500"
              aria-hidden="true"
            >
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            aria-label={`Go to page ${page}`}
            aria-current={isActive ? "page" : undefined}
            className={`${baseButtonClass} ${isActive ? activeButtonClass : defaultButtonClass}`}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
        className={`${baseButtonClass} ${currentPage === totalPages ? disabledButtonClass : defaultButtonClass}`}
      >
        {">"}
      </button>

      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Go to last page"
        className={`${baseButtonClass} ${currentPage === totalPages ? disabledButtonClass : defaultButtonClass}`}
      >
        {">>"}
      </button>
    </nav>
  );
}
