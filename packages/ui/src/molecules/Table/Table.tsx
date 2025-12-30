import { clsx } from "clsx";
import styles from "./Table.module.scss";

export const Table = {
  Root: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={styles.container}>
      <table className={clsx(styles.table, className)}>{children}</table>
    </div>
  ),
  Header: ({ children }: { children: React.ReactNode }) => <thead className={styles.header}>{children}</thead>,
  Body: ({ children }: { children: React.ReactNode }) => <tbody className={styles.body}>{children}</tbody>,
  Row: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <tr className={clsx(styles.row, className)}>{children}</tr>
  ),
  Cell: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <td className={clsx(styles.cell, className)}>{children}</td>
  ),
  HeadCell: ({ children }: { children: React.ReactNode }) => <th className={styles.headCell}>{children}</th>,
};
