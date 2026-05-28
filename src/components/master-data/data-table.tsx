import type { ReactNode } from "react";

interface DataTableProps {
  columns: string[];
  children: ReactNode;
  empty?: ReactNode;
  isEmpty?: boolean;
}

export function DataTable({ columns, children, empty, isEmpty }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isEmpty ? (
              <tr>
                <td className="px-4 py-8" colSpan={columns.length}>
                  {empty}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
