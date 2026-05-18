import { useState, useEffect, useMemo, useCallback } from "react";

/**
 * Debounces a value by the specified delay.
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for filtering items based on search query and optional filter value.
 * @param items - The array of items to filter
 * @param searchFields - The object keys to search against
 * @param filterField - Optional key to match against the filter value
 * @returns Object containing filtered items and state setters
 */
export function useSearchFilter<T>(
  items: T[],
  searchFields: (keyof T)[],
  filterField?: keyof T
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !debouncedSearch ||
        searchFields.some((field) => {
          const val = item[field];
          return (
            typeof val === "string" &&
            val.toLowerCase().includes(debouncedSearch.toLowerCase())
          );
        });

      const matchesFilter =
        !filterValue ||
        (filterField !== undefined && String(item[filterField]) === filterValue);

      return matchesSearch && matchesFilter;
    });
  }, [items, debouncedSearch, searchFields, filterField, filterValue]);

  return { filteredItems, searchQuery, setSearchQuery, filterValue, setFilterValue };
}

interface SearchFilterProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  filters?: { label: string; value: string }[];
  onFilterChange?: (val: string) => void;
}

/**
 * Search and filter UI component with debounced input and optional filter dropdown.
 * @param value - Current search input value
 * @param onChange - Callback when search value changes
 * @param placeholder - Placeholder text for the search input
 * @param filters - Array of filter options for the dropdown
 * @param onFilterChange - Callback when filter selection changes
 */
export function SearchFilter({
  value,
  onChange,
  placeholder = "Search...",
  filters,
  onFilterChange,
}: SearchFilterProps) {
  const handleClear = useCallback(() => {
    onChange("");
  }, [onChange]);

  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange?.(e.target.value);
    },
    [onFilterChange]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2.5 pl-10 pr-10 text-sm text-gray-100 placeholder-gray-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-200"
            aria-label="Clear search"
          >
            <svg
              className="size-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {filters && filters.length > 0 && onFilterChange && (
        <select
          onChange={handleFilterChange}
          className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-gray-100 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All</option>
          {filters.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
