"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

interface DataTableProps {
  columns: string[];
  children: ReactNode;
  empty?: ReactNode;
  isEmpty?: boolean;
  isLoading?: boolean;
  searchPlaceholder?: string;
  maxHeightClassName?: string;
  enableSearch?: boolean;
  enablePagination?: boolean;
  enableRowNumbers?: boolean;
  enableColumnVisibility?: boolean;
  stickyActionColumn?: boolean;
}

const rowsPerPageOptions = [10, 25, 50, 100];

type RowElement = ReactElement<{
  children?: ReactNode;
  className?: string;
}>;

export function DataTable({
  columns,
  children,
  empty,
  isEmpty,
  isLoading = false,
  searchPlaceholder = "Cari data...",
  maxHeightClassName = "max-h-[65vh]",
  enableSearch = true,
  enablePagination = true,
  enableRowNumbers = true,
  enableColumnVisibility = true,
  stickyActionColumn = true,
}: DataTableProps) {
  const [query, setQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const allRows = useMemo(() => flattenRows(children), [children]);
  const filteredRows = useMemo(() => {
    if (!query.trim()) {
      return allRows;
    }

    const normalizedQuery = query.trim().toLowerCase();

    return allRows.filter((row) =>
      extractText(row).toLowerCase().includes(normalizedQuery),
    );
  }, [allRows, query]);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = enablePagination
    ? filteredRows.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
      )
    : filteredRows;
  const visibleColumns = columns.filter((_, index) => !hiddenColumns.has(index));
  const colSpan = visibleColumns.length + (enableRowNumbers ? 1 : 0);
  const shouldShowEmpty = Boolean(isEmpty) || filteredRows.length === 0;

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateRowsPerPage(value: string) {
    setRowsPerPage(Number(value));
    setPage(1);
  }

  function toggleColumn(index: number) {
    setHiddenColumns((current) => {
      const next = new Set(current);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {enableSearch ? (
            <input
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary md:max-w-xs"
            />
          ) : null}
          {enableColumnVisibility && columns.length > 4 ? (
            <details className="relative">
              <summary className="flex h-9 cursor-pointer list-none items-center rounded-md border px-3 text-sm hover:bg-muted">
                Kolom
              </summary>
              <div className="absolute z-30 mt-2 grid min-w-56 gap-2 rounded-md border bg-popover p-3 text-sm shadow-md">
                {columns.map((column, index) => (
                  <label key={column} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.has(index)}
                      onChange={() => toggleColumn(index)}
                    />
                    <span>{column}</span>
                  </label>
                ))}
              </div>
            </details>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground md:justify-end">
          <span>{filteredRows.length} data</span>
          {enablePagination ? (
            <label className="flex items-center gap-2">
              <span>Rows</span>
              <select
                value={rowsPerPage}
                onChange={(event) => updateRowsPerPage(event.target.value)}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                {rowsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>

      <div className={cn("overflow-auto", maxHeightClassName)}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="sticky top-0 z-20 border-b bg-card text-xs uppercase text-muted-foreground shadow-sm">
            <tr>
              {enableRowNumbers ? (
                <th className="w-14 whitespace-nowrap px-4 py-3 font-medium">
                  No
                </th>
              ) : null}
              {visibleColumns.map((column, index) => {
                const originalIndex = columns.indexOf(column);
                const isActionColumn =
                  stickyActionColumn && originalIndex === columns.length - 1;

                return (
                  <th
                    key={`${column}-${index}`}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 font-medium",
                      isActionColumn &&
                        "sticky right-0 z-30 border-l bg-card shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.7)]",
                    )}
                  >
                    {column}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <LoadingRows colSpan={colSpan} />
            ) : shouldShowEmpty ? (
              <tr>
                <td className="px-4 py-8 text-center" colSpan={colSpan}>
                  {query ? "Data tidak ditemukan." : empty ?? "Belum ada data."}
                </td>
              </tr>
            ) : (
              pagedRows.map((row, index) =>
                renderRow({
                  row,
                  rowNumber: enablePagination
                    ? (currentPage - 1) * rowsPerPage + index + 1
                    : index + 1,
                  columns,
                  hiddenColumns,
                  enableRowNumbers,
                  stickyActionColumn,
                }),
              )
            )}
          </tbody>
        </table>
      </div>

      {enablePagination ? (
        <div className="flex flex-col gap-3 border-t p-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Halaman {currentPage} dari {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
              className="rounded-md border px-3 py-1.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(pageCount, current + 1))
              }
              disabled={currentPage >= pageCount}
              className="rounded-md border px-3 py-1.5 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderRow({
  row,
  rowNumber,
  columns,
  hiddenColumns,
  enableRowNumbers,
  stickyActionColumn,
}: {
  row: ReactNode;
  rowNumber: number;
  columns: string[];
  hiddenColumns: Set<number>;
  enableRowNumbers: boolean;
  stickyActionColumn: boolean;
}) {
  if (!isValidElement(row)) {
    return row;
  }

  const rowElement = row as RowElement;
  const cells = Children.toArray(rowElement.props.children);
  const visibleCells = cells.filter((_, index) => !hiddenColumns.has(index));

  return cloneElement(
    rowElement,
    {
      className: cn(
        "odd:bg-background even:bg-muted/20 hover:bg-muted/50",
        rowElement.props.className,
      ),
    },
    <>
      {enableRowNumbers ? (
        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
          {rowNumber}
        </td>
      ) : null}
      {visibleCells.map((cell) => {
        const originalIndex = cells.indexOf(cell);
        const isActionCell =
          stickyActionColumn && originalIndex === columns.length - 1;

        if (!isValidElement(cell)) {
          return cell;
        }

        return cloneElement(cell as RowElement, {
          className: cn(
            (cell as RowElement).props.className,
            isActionCell &&
              "sticky right-0 z-10 border-l bg-inherit shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.7)]",
          ),
        });
      })}
    </>,
  );
}

function LoadingRows({ colSpan }: { colSpan: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index}>
          <td className="px-4 py-3" colSpan={colSpan}>
            <div className="h-5 animate-pulse rounded bg-muted" />
          </td>
        </tr>
      ))}
    </>
  );
}

function flattenRows(children: ReactNode): ReactNode[] {
  return Children.toArray(children);
}

function extractText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join(" ");
  }

  if (isValidElement(node)) {
    return extractText((node as RowElement).props.children);
  }

  return "";
}
