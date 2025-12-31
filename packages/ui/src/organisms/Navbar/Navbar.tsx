import styles from "./Navbar.module.scss";

interface NavbarProps {
  title: React.ReactNode; // Было string, стало React.ReactNode
  actions?: React.ReactNode;
}

export const Navbar = ({ title, actions }: NavbarProps) => {
  return (
    <header className={styles.navbar}>
      <div className={styles.title}>{title}</div>
      <div className={styles.actions}>{actions}</div>
    </header>
  );
};
