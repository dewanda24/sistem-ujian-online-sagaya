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
import { UI_LABELS } from "@/constants/ui-labels";
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
  searchPlaceholder = UI_LABELS.tables.searchPlaceholder,
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
    ? filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
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
    <div className="md-card-elevated overflow-hidden bg-white text-[#1E293B]">
      {/* ── Header Controls ── */}
      <div className="flex flex-col gap-3 border-b border-[#F1F5F9] p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {enableSearch ? (
            <input
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-[48px] w-full rounded-2xl border-[1.5px] border-[#CBD5E1] bg-white px-4 text-[14px] outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15 md:max-w-xs"
            />
          ) : null}
          {enableColumnVisibility && columns.length > 4 ? (
            <details className="relative">
              <summary className="flex h-[48px] cursor-pointer list-none items-center rounded-2xl border-[1.5px] border-[#CBD5E1] px-4 text-[14px] font-semibold hover:bg-[#F8FAFC]">
                {UI_LABELS.tables.columns}
              </summary>
              <div className="absolute z-30 mt-2 grid min-w-[220px] gap-2 rounded-2xl border border-[#CBD5E1] bg-white p-4 shadow-xl">
                {columns.map((column, index) => (
                  <label key={column} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!hiddenColumns.has(index)}
                      onChange={() => toggleColumn(index)}
                      className="size-4 accent-[#2563EB]"
                    />
                    <span className="text-[14px]">{column}</span>
                  </label>
                ))}
              </div>
            </details>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 text-[13px] font-semibold text-[#64748B] md:justify-end">
          <span>
            {filteredRows.length} {UI_LABELS.tables.dataCount}
          </span>
          {enablePagination ? (
            <label className="flex items-center gap-2">
              <span>{UI_LABELS.tables.rows}</span>
              <select
                value={rowsPerPage}
                onChange={(event) => updateRowsPerPage(event.target.value)}
                className="h-10 rounded-xl border border-[#CBD5E1] bg-white px-2 text-[13px] font-semibold"
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

      {/* ── Mobile List View ── */}
      <div className="grid gap-3 p-4 md:hidden">
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
              rowNumber={enablePagination ? (currentPage - 1) * rowsPerPage + index + 1 : index + 1}
              enableRowNumbers={enableRowNumbers}
            />
          ))
        )}
      </div>

      {/* ── Desktop Table View ── */}
      <div className={cn("hidden md:block md:overflow-auto", maxHeightClassName)}>
        <table className="w-full min-w-[760px] text-left text-[14px]">
          <thead className="sticky top-0 z-20 border-b border-[#F1F5F9] bg-[#F8FAFC] text-[12px] uppercase font-bold text-[#64748B]">
            <tr>
              {enableRowNumbers ? (
                <th className="w-14 whitespace-nowrap px-4 py-3">{UI_LABELS.tables.no}</th>
              ) : null}
              {visibleColumns.map((column, index) => {
                const originalIndex = columns.indexOf(column);
                const isActionColumn = stickyActionColumn && originalIndex === columns.length - 1;

                return (
                  <th
                    key={`${column}-${index}`}
                    className={cn(
                      "whitespace-nowrap px-4 py-3",
                      isActionColumn &&
                        "sticky right-0 z-30 border-l border-[#F1F5F9] bg-[#F8FAFC] shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.7)]",
                    )}
                  >
                    {column}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {isLoading ? (
              <LoadingRows colSpan={colSpan} />
            ) : shouldShowEmpty ? (
              <tr>
                <td className="px-4 py-12 text-center" colSpan={colSpan}>
                  {renderEmptyState(query, empty)}
                </td>
              </tr>
            ) : (
              pagedRows.map((row, index) =>
                renderRow({
                  row,
                  rowNumber: enablePagination ? (currentPage - 1) * rowsPerPage + index + 1 : index + 1,
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

      {/* ── Pagination ── */}
      {enablePagination ? (
        <div className="flex flex-col gap-3 border-t border-[#F1F5F9] p-4 text-[13px] font-semibold text-[#64748B] sm:flex-row sm:items-center sm:justify-between">
          <span>
            {UI_LABELS.tables.page} {currentPage} dari {pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
              className="rounded-full border border-[#CBD5E1] px-4 h-10 hover:bg-[#F8FAFC] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 transition-transform"
            >
              {UI_LABELS.actions.previous}
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={currentPage >= pageCount}
              className="rounded-full border border-[#CBD5E1] px-4 h-10 hover:bg-[#F8FAFC] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 transition-transform"
            >
              {UI_LABELS.actions.next}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function renderEmptyState(query: string, empty?: ReactNode) {
  if (query) {
    return <EmptyState title={UI_LABELS.messages.noSearchResult} description={UI_LABELS.messages.noSearchResultDescription} icon="empty" />;
  }
  if (empty) {
    if (typeof empty === "string") return <EmptyState title={empty} description={UI_LABELS.messages.dataWillAppear} icon="empty" />;
    return empty;
  }
  return <EmptyState title={UI_LABELS.messages.noData} description={UI_LABELS.messages.dataWillAppear} icon="empty" />;
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
  if (!isValidElement(row)) return row;

  const rowElement = row as RowElement;
  const cells = Children.toArray(rowElement.props.children);
  const visibleCells = cells.filter((_, index) => !hiddenColumns.has(index));

  return cloneElement(
    rowElement,
    {
      className: cn("h-16 odd:bg-white even:bg-[#F8FAFC]/50 hover:bg-[#F1F5F9] transition-colors", rowElement.props.className),
    },
    <>
      {enableRowNumbers ? (
        <td className="whitespace-nowrap px-4 py-3 text-[#64748B] font-medium">{rowNumber}</td>
      ) : null}
      {visibleCells.map((cell) => {
        const originalIndex = cells.indexOf(cell);
        const isActionCell = stickyActionColumn && originalIndex === columns.length - 1;

        if (!isValidElement(cell)) return cell;

        return cloneElement(cell as RowElement, {
          className: cn(
            (cell as RowElement).props.className,
            "px-4 py-3",
            isActionCell && "sticky right-0 z-10 border-l border-[#F1F5F9] bg-inherit shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.7)]",
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
          <td className="px-4 py-4" colSpan={colSpan}>
            <div className="h-5 animate-pulse rounded bg-[#E2E8F0]" />
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
        <div key={index} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <div className="h-5 w-2/3 animate-pulse rounded bg-[#CBD5E1]" />
          <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[#E2E8F0]" />
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
  if (!isValidElement(row)) return null;

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
    <article className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition active:scale-[0.98]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-[#1E293B] leading-snug">
            {enableRowNumbers ? <span className="text-[#64748B] mr-1">{rowNumber}.</span> : null}
            {title}
          </div>
          {subtitle ? (
            <div className="mt-1 line-clamp-2 text-[13px] font-medium text-[#64748B] leading-relaxed">
              {subtitle}
            </div>
          ) : null}
        </div>
        
        {/* Action goes to top-right if small enough, but typically we want it accessible */}
        {actionEntry ? (
          <div className="shrink-0 [&_a]:px-2 [&_button]:px-2">
            {getCellContent(actionEntry.cell)}
          </div>
        ) : null}
      </div>
      
      {metaEntries.length ? (
        <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-medium text-[#64748B]">
          {metaEntries.map((entry) => (
            <span
              key={`${entry.column}-${entry.index}`}
              className="inline-flex items-center gap-1 max-w-full truncate rounded-lg bg-[#F1F5F9] px-2.5 py-1"
            >
              <span className="opacity-70">{entry.column}:</span>
              <span className="text-[#1E293B] font-semibold">{extractText(entry.cell)}</span>
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
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (isValidElement(node)) return extractText((node as RowElement).props.children);
  return "";
}
