"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

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
  tableClassName?: string;
  containerClassName?: string;
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
  maxHeightClassName = "",
  tableClassName,
  containerClassName,
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
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target as Node)
      ) {
        setIsColumnMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsColumnMenuOpen(false);
      }
    }
    if (isColumnMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isColumnMenuOpen]);

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

  const fromCount = filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const toCount = Math.min(currentPage * rowsPerPage, filteredRows.length);

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
        if (columns.length - current.size <= 1) {
          return current;
        }
        next.add(index);
      }
      return next;
    });
  }

  function resetColumns() {
    setHiddenColumns(new Set());
  }

  function hideAllOptionalColumns() {
    const next = new Set<number>();
    columns.forEach((col, idx) => {
      const isAction = idx === columns.length - 1 && /aksi|action/i.test(col);
      if (idx !== 0 && !isAction) {
        next.add(idx);
      }
    });
    setHiddenColumns(next);
  }

  const showToolbar =
    enableSearch ||
    (enableColumnVisibility && columns.length > 3) ||
    enablePagination;

  return (
    <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* ── Table Toolbar ── */}
      {showToolbar ? (
        <div className="flex flex-col gap-3 border-b border-border/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            {enableSearch ? (
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => updateQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-8 text-xs placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => updateQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
                    title="Hapus pencarian"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>
            ) : null}

            {enableColumnVisibility && columns.length > 3 ? (
              <div className="relative" ref={columnMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsColumnMenuOpen((prev) => !prev)}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-xl border border-input bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all select-none shadow-2xs",
                    isColumnMenuOpen && "border-primary/40 text-foreground bg-muted/40 ring-2 ring-primary/10",
                    hiddenColumns.size > 0 && "border-primary/50 text-primary bg-primary/5 font-semibold",
                  )}
                  aria-expanded={isColumnMenuOpen}
                  aria-label="Atur visibilitas kolom tabel"
                >
                  <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                  <span>{UI_LABELS.tables.columns}</span>
                  {hiddenColumns.size > 0 ? (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {columns.length - hiddenColumns.size}/{columns.length}
                    </span>
                  ) : null}
                  <ChevronDown
                    className={cn(
                      "size-3 text-muted-foreground/70 transition-transform duration-200",
                      isColumnMenuOpen && "rotate-180",
                    )}
                  />
                </button>

                {isColumnMenuOpen ? (
                  <div className="absolute left-0 z-50 mt-2 w-64 rounded-2xl border border-border/80 bg-popover/95 p-1 text-popover-foreground shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
                      <div>
                        <div className="text-xs font-semibold text-foreground">Visibilitas Kolom</div>
                        <div className="text-[11px] text-muted-foreground">
                          {columns.length - hiddenColumns.size} dari {columns.length} kolom aktif
                        </div>
                      </div>
                      {hiddenColumns.size > 0 ? (
                        <button
                          type="button"
                          onClick={resetColumns}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10 transition-colors"
                          title="Tampilkan semua kolom"
                        >
                          <RotateCcw className="size-3" />
                          Reset
                        </button>
                      ) : null}
                    </div>

                    {/* Column List */}
                    <div className="max-h-64 overflow-y-auto p-1 space-y-0.5">
                      {columns.map((column, index) => {
                        const isVisible = !hiddenColumns.has(index);
                        const isAction = index === columns.length - 1 && /aksi|action/i.test(column);
                        const isMandatory = isAction || (columns.length - hiddenColumns.size <= 1 && isVisible);

                        return (
                          <button
                            key={column}
                            type="button"
                            disabled={isMandatory}
                            onClick={() => toggleColumn(index)}
                            className={cn(
                              "w-full flex items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-xs transition-colors text-left group",
                              isVisible
                                ? "text-foreground hover:bg-muted/70"
                                : "text-muted-foreground hover:bg-muted/40 opacity-70",
                              isMandatory && "cursor-not-allowed opacity-60 hover:bg-transparent",
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={cn(
                                  "size-4 rounded-md border flex items-center justify-center transition-all shrink-0",
                                  isVisible
                                    ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                                    : "border-input bg-background group-hover:border-muted-foreground",
                                )}
                              >
                                {isVisible && <Check className="size-2.5 stroke-[3]" />}
                              </div>
                              <span className={cn("truncate font-medium", !isVisible && "line-through text-muted-foreground")}>
                                {column}
                              </span>
                            </div>

                            {isAction ? (
                              <span className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded font-mono shrink-0">
                                Tetap
                              </span>
                            ) : isVisible ? (
                              <Eye className="size-3.5 text-muted-foreground/60 shrink-0 group-hover:text-foreground transition-colors" />
                            ) : (
                              <EyeOff className="size-3.5 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Footer Quick Presets */}
                    <div className="flex items-center justify-between border-t border-border/60 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                      <button
                        type="button"
                        onClick={resetColumns}
                        className="hover:text-foreground transition-colors font-medium"
                      >
                        Pilih Semua
                      </button>
                      <button
                        type="button"
                        onClick={hideAllOptionalColumns}
                        className="hover:text-foreground transition-colors font-medium"
                      >
                        Mode Ringkas
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground sm:justify-end">
            <span className="inline-flex items-center rounded-full bg-muted/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {filteredRows.length} data
            </span>

            {enablePagination ? (
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Baris:</span>
                <select
                  value={rowsPerPage}
                  onChange={(event) => updateRowsPerPage(event.target.value)}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
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
      ) : null}

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
      <div
        className={cn(
          "hidden md:block overflow-x-auto",
          maxHeightClassName && cn("overflow-y-auto", maxHeightClassName),
          containerClassName,
        )}
      >
        <table className={cn("w-full text-left text-[13px]", tableClassName)}>
          <thead className="sticky top-0 z-20 border-b border-border/80 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
            <tr>
              {enableRowNumbers ? (
                <th className="w-12 whitespace-nowrap px-3 py-3 text-center text-muted-foreground/70 font-mono">
                  {UI_LABELS.tables.no}
                </th>
              ) : null}
              {visibleColumns.map((column, index) => {
                const originalIndex = columns.indexOf(column);
                const isActionColumn = originalIndex === columns.length - 1;
                const columnTitle = column.toLowerCase();
                const isActionLike = isActionColumn && (columnTitle.includes("aksi") || columnTitle.includes("action"));
                const isSticky = stickyActionColumn && isActionColumn;

                return (
                  <th
                    key={`${column}-${index}`}
                    className={cn(
                      "whitespace-nowrap px-3 py-3 font-semibold",
                      isSticky &&
                        "sticky right-0 z-30 border-l border-border bg-muted/80 shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.12)] backdrop-blur-sm",
                      isActionLike && "text-right pr-4 w-14",
                    )}
                  >
                    {column}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
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

      {/* ── Pagination Footer ── */}
      {enablePagination && filteredRows.length > 0 ? (
        <div className="flex flex-col gap-2.5 border-t border-border/80 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="font-medium">
            Menampilkan <strong className="text-foreground">{fromCount}</strong>–<strong className="text-foreground">{toCount}</strong> dari{" "}
            <strong className="text-foreground">{filteredRows.length}</strong> data
          </div>
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="mr-1 text-[11px] text-muted-foreground">
              Hal. {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              title={UI_LABELS.actions.previous}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={currentPage >= pageCount}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input bg-background hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
              title={UI_LABELS.actions.next}
            >
              <ChevronRight className="size-4" />
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
        title={UI_LABELS.messages.noSearchResult}
        description={UI_LABELS.messages.noSearchResultDescription}
        icon="empty"
      />
    );
  }
  if (empty) {
    if (typeof empty === "string") {
      return (
        <EmptyState
          title={empty}
          description={UI_LABELS.messages.dataWillAppear}
          icon="empty"
        />
      );
    }
    return empty;
  }
  return (
    <EmptyState
      title={UI_LABELS.messages.noData}
      description={UI_LABELS.messages.dataWillAppear}
      icon="empty"
    />
  );
}

function isElementLike(
  node: unknown,
): node is { props: { children?: ReactNode; className?: string } } {
  if (!node || typeof node !== "object") return false;
  return "props" in (node as Record<string, unknown>);
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
  const rawChildren = rowElement.props ? rowElement.props.children : null;
  const cells = Children.toArray(rawChildren);
  const visibleEntries = cells
    .map((cell, index) => ({ cell, originalIndex: index }))
    .filter((entry) => !hiddenColumns.has(entry.originalIndex));

  return cloneElement(
    rowElement,
    {
      className: cn(
        "group odd:bg-card even:bg-muted/15 hover:bg-muted/40 transition-colors",
        rowElement.props.className,
      ),
    },
    <>
      {enableRowNumbers ? (
        <td className="whitespace-nowrap px-3 py-3 text-center text-xs font-mono text-muted-foreground/70">
          {rowNumber}
        </td>
      ) : null}
      {visibleEntries.map(({ cell, originalIndex }) => {
        const isActionCell = originalIndex === columns.length - 1;
        const columnTitle = columns[originalIndex]?.toLowerCase() ?? "";
        const isActionColumn =
          isActionCell &&
          (columnTitle.includes("aksi") || columnTitle.includes("action"));

        if (!isValidElement(cell)) return cell;

        const cellEl = cell as RowElement;
        const isSticky = stickyActionColumn && isActionCell;

        return cloneElement(cellEl, {
          className: cn(
            cellEl.props.className,
            isSticky &&
              "sticky right-0 z-10 border-l border-border bg-card group-even:bg-muted/25 group-hover:bg-muted/50 transition-colors shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.12)]",
            isActionColumn && "text-right pr-4 whitespace-nowrap w-14",
          ),
        });
      })}
    </>,
  );
}

function LoadingRows({ colSpan }: { colSpan: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index}>
          <td className="px-4 py-3.5" colSpan={colSpan}>
            <div className="h-4 animate-pulse rounded bg-muted" />
          </td>
        </tr>
      ))}
    </>
  );
}

function LoadingCards() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted/60" />
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
  if (!isValidElement(row) && !isElementLike(row)) return null;

  const rowElement = row as RowElement;
  const rawChildren = rowElement.props ? rowElement.props.children : null;
  const cells = Children.toArray(rawChildren);
  const visibleEntries = cells
    .map((cell, index) => ({ cell, column: columns[index] || `Kolom ${index + 1}`, index }))
    .filter((entry) => !hiddenColumns.has(entry.index));

  if (!visibleEntries.length) return null;

  const primaryEntry = visibleEntries[0];
  const lastEntry = visibleEntries[visibleEntries.length - 1];
  const isActionColumn =
    visibleEntries.length > 1 &&
    Boolean(lastEntry.column && /aksi|action/i.test(lastEntry.column));
  const actionEntry = isActionColumn ? lastEntry : null;
  const metaEntries = visibleEntries.slice(1, actionEntry ? -1 : undefined);

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm hover:border-border/80 transition space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 flex items-start gap-2">
          {enableRowNumbers ? (
            <span className="inline-flex items-center justify-center rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-mono font-semibold text-muted-foreground shrink-0 mt-0.5">
              {rowNumber}
            </span>
          ) : null}
          <div className="min-w-0 flex-1 font-semibold text-foreground leading-snug">
            {getCellContent(primaryEntry.cell)}
          </div>
        </div>

        {actionEntry ? (
          <div className="shrink-0">
            {getCellContent(actionEntry.cell)}
          </div>
        ) : null}
      </div>

      {metaEntries.length ? (
        <div className="space-y-2 border-t border-border/40 pt-2.5">
          {metaEntries.map((entry) => (
            <div
              key={`${entry.column}-${entry.index}`}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">
                {entry.column}
              </span>
              <div className="font-medium text-foreground text-right">
                {getCellContent(entry.cell)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function getCellContent(cell: ReactNode): ReactNode {
  if (isValidElement(cell)) {
    return (cell as RowElement).props.children;
  }
  if (isElementLike(cell)) {
    return cell.props.children;
  }
  return cell;
}

function flattenRows(children: ReactNode): ReactNode[] {
  return Children.toArray(children);
}

function extractText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).filter(Boolean).join(" ");
  if (isValidElement(node) || isElementLike(node)) {
    return extractText((node as { props?: { children?: ReactNode } }).props?.children);
  }
  return "";
}
