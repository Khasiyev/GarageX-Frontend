import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T) => string | number;
}

export function Table<T>({ columns, data, onRowClick, keyExtractor }: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-skin-border">
      <table className="w-full">
        <thead>
          <tr className="bg-skin-bg border-b border-skin-border">
            {columns.map((col) => (
              <th key={col.key} className="text-left text-xs font-semibold text-skin-text3 uppercase tracking-wider px-5 py-3.5">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-skin-card">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-skin-text3 py-12 text-sm">
                Məlumat tapılmadı
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-skin-border last:border-b-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-skin-hover' : 'hover:bg-skin-hover/50'}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4 text-sm text-skin-text2">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
