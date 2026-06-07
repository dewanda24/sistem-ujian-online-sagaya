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

import { EmptyState } from "@/components/dashboard/empty-state";
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
    <div className="rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          {enableSearch ? (
            <input
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 md:max-w-xs"
            />
          ) : null}
          {enableColumnVisibility && columns.length > 4 ? (
            <details className="relative">
              <summary className="flex h-10 cursor-pointer list-none items-center rounded-xl border border-[#E2E8F0] px-3 text-sm hover:bg-[#F8FAFC]">
                Kolom
              </summary>
              <div className="absolute z-30 mt-2 grid min-w-56 gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3 text-sm shadow-lg">
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

        <div className="flex items-center justify-between gap-3 text-sm text-[#64748B] md:justify-end">
          <span>{filteredRows.length} data</span>
          {enablePagination ? (
            <label className="flex items-center gap-2">
              <span>Rows</span>
              <select
                value={rowsPerPage}
                onChange={(event) => updateRowsPerPage(event.target.value)}
                className="h-10 rounded-xl border border-[#E2E8F0] bg-white px-2 text-sm"
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

      <div className="grid gap-2 p-3 md:hidden">
        {isLoading ? (
          <LoadingCards />
        ) : shouldShowEmpty ? (
          renderEmptyState(query, empty)
        ) : (
          pagedRows.map((row, index) => (
            <MobileRowCard
              key={index}
              row={row}
              columns={columns}
              hiddenColumns={hiddenColumns}
              rowNumber={
                enablePagination
                  ? (currentPage - 1) * rowsPerPage + index + 1
                  : index + 1
              }
              enableRowNumbers={enableRowNumbers}
            />
          ))
        )}
      </div>

      <div className={cn("hidden md:block md:overflow-auto", maxHeightClassName)}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white text-xs uppercase text-[#64748B] shadow-sm">
            <tr>
              {enableRowNumbers ? (
                <th className="w-14 whitespace-nowrap px-3 py-2 font-medium">
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
                      "whitespace-nowrap px-3 py-2 font-medium",
                      isActionColumn &&
                        "sticky right-0 z-30 border-l border-[#E2E8F0] bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.7)]",
                    )}
                  >
                    {column}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {isLoading ? (
              <LoadingRows colSpan={colSpan} />
            ) : shouldShowEmpty ? (
              <tr>
                <td className="px-4 py-8 text-center" colSpan={colSpan}>
                  {renderEmptyState(query, empty)}
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
        <div className="flex flex-col gap-3 border-t border-[#E2E8F0] p-3 text-sm text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Halaman {currentPage} dari {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
              className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(pageCount, current + 1))
              }
              disabled={currentPage >= pageCount}
              className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderEmptyState(query: string, empty?: ReactNode) {
  if (query) {
    return (
      <EmptyState
        title="Data tidak ditemukan"
        description="Coba gunakan kata kunci lain atau reset filter."
      />
    );
  }

  if (empty) {
    if (typeof empty === "string") {
      return (
        <EmptyState
          title={empty}
          description="Data akan muncul setelah tersedia."
        />
      );
    }

    return empty;
  }

  return (
    <EmptyState
      title="Belum ada data"
      description="Data akan muncul setelah dibuat atau diimport."
    />
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
        "h-14 odd:bg-white even:bg-[#F8FAFC]/60 hover:bg-[#F8FAFC]",
        rowElement.props.className,
      ),
    },
    <>
      {enableRowNumbers ? (
        <td className="whitespace-nowrap px-3 py-2 text-[#64748B]">
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
            "px-3 py-2",
            isActionCell &&
              "sticky right-0 z-10 border-l border-[#E2E8F0] bg-inherit shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.7)]",
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

function LoadingCards() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      ))}
    </>
  );
}

function MobileRowCard({
  row,
  columns,
  hiddenColumns,
  rowNumber,
  enableRowNumbers,
}: {
  row: ReactNode;
  columns: string[];
  hiddenColumns: Set<number>;
  rowNumber: number;
  enableRowNumbers: boolean;
}) {
  if (!isValidElement(row)) {
    return null;
  }

  const rowElement = row as RowElement;
  const cells = Children.toArray(rowElement.props.children);
  const visibleEntries = cells
    .map((cell, index) => ({ cell, column: columns[index], index }))
    .filter((entry) => !hiddenColumns.has(entry.index));
  const title = extractText(visibleEntries[0]?.cell).trim() || `Data ${rowNumber}`;
  const subtitle = extractText(visibleEntries[1]?.cell).trim();
  const actionEntry = visibleEntries[visibleEntries.length - 1];
  const metaEntries = visibleEntries.slice(2, -1).slice(0, 3);

  return (
    <article className="max-h-[132px] overflow-hidden rounded-xl border border-[#E2E8F0] bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="line-clamp-1 text-sm font-medium text-[#0F172A]">
            {enableRowNumbers ? `${rowNumber}. ` : null}
            {title}
          </div>
          {subtitle ? (
            <div className="mt-0.5 line-clamp-1 text-xs text-[#64748B]">
              {subtitle}
            </div>
          ) : null}
        </div>
        {actionEntry ? (
          <div className="shrink-0 [&_a]:px-2 [&_button]:px-2">
            {getCellContent(actionEntry.cell)}
          </div>
        ) : null}
      </div>
      {metaEntries.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-[#64748B]">
          {metaEntries.map((entry) => (
            <span
              key={`${entry.column}-${entry.index}`}
              className="max-w-full truncate rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-0.5"
            >
              {entry.column}: {extractText(entry.cell)}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function getCellContent(cell: ReactNode) {
  if (isValidElement(cell)) {
    return (cell as RowElement).props.children;
  }

  return cell;
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
