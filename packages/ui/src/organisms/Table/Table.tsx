import { clsx } from "clsx";
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
}

export const Table = <T extends { id: string | number }>({ data, columns, className, onRowClick }: TableProps<T>) => {
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
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                  onRowClick(item);
                }
              }}
              className={clsx(onRowClick && styles.clickable)}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? "button" : undefined}
            >
              {columns.map((column) => {
                // Создаем уникальный ключ для ячейки на основе ID строки и заголовка колонки
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
