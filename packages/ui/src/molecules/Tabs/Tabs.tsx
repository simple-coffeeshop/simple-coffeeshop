import { clsx } from "clsx";
import styles from "./Tabs.module.scss";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, activeTab, onChange, className }: TabsProps) => {
  return (
    <div className={clsx(styles.tabsContainer, className)} role="tablist">
      {tabs.map((tab) => (
        <button
          type="button" // Добавляем это
          key={tab.id}
          className={clsx(styles.tab, activeTab === tab.id && styles.active)}
          onClick={() => onChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
        >
          {tab.label}
          {activeTab === tab.id && <div className={styles.indicator} />}
        </button>
      ))}
    </div>
  );
};
