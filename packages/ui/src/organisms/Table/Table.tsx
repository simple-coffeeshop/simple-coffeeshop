// packages/ui/src/organisms/Table/Table.tsx

import { clsx } from "clsx";
import { Skeleton } from "../../atoms/Skeleton/Skeleton";
import styles from "./Table.module.scss";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  width?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

// [EVA_FIX]: Стабильные ключи для строк загрузки (не зависят от индекса)
const SKELETON_ROWS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"];

export const Table = <T extends { id: string | number }>({
  data,
  columns,
  className,
  onRowClick,
  isLoading,
}: TableProps<T>) => {
  return (
    <div className={clsx(styles.tableWrapper, className)}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} style={{ width: column.width }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? // [EVA_FIX]: Используем SKELETON_ROWS вместо индекса массива
              SKELETON_ROWS.map((rowId) => (
                <tr key={rowId}>
                  {columns.map((col) => (
                    <td key={`${rowId}-${col.header}`}>
                      <Skeleton className={styles.skeletonCell} />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={clsx(onRowClick && styles.clickable)}
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {columns.map((column) => {
                    const cellKey = `${item.id}-${column.header}`;
                    return (
                      <td key={cellKey}>
                        {typeof column.accessor === "function"
                          ? column.accessor(item)
                          : (item[column.accessor] as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
};
