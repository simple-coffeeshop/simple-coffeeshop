import { Button, Navbar, Sidebar, Tooltip } from "@simple-coffeeshop/ui";
import { Boxes, Briefcase, LayoutDashboard, LogOut, Menu, Search, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./RootLayout.module.scss";

export const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [osKey, setOsKey] = useState("Ctrl");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.userAgent);
    setOsKey(isMac ? "⌘" : "Ctrl");
  }, []);

  // Закрываем боковую панель при каждой смене страницы
  // biome-ignore lint/correctness/useExhaustiveDependencies: Trigger reset on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const navItems = useMemo(
    () => [
      { id: "/", label: "Dashboard", href: "/", icon: <LayoutDashboard size={18} /> },
      { id: "/orders", label: "Orders", href: "/orders", icon: <ShoppingCart size={18} /> },
      { id: "/module-01", label: "Businesses", href: "/module-01", icon: <Briefcase size={18} /> },
      { id: "/module-02", label: "Units", href: "/module-02", icon: <Boxes size={18} /> },
    ],
    [],
  );

  const activeTitle = navItems.find((item) => item.id === pathname)?.label || "Aurora";

  return (
    <div className={styles.container}>
      <Sidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        items={navItems}
        activeId={pathname}
        onNavigate={(id: string) => navigate(id)}
        logo={
          <div className={styles.logo}>
            <div className={styles.logoIcon}>☕️</div>
            <span>Coffee-Ops</span>
          </div>
        }
      />

      <main className={styles.main}>
        <Navbar
          title={
            <div className={styles.titleWrapper}>
              <button
                type="button"
                className={styles.mobileMenuBtn}
                onClick={() => setIsMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <span>{activeTitle}</span>
            </div>
          }
          actions={
            <div className={styles.headerActions}>
              <div className={styles.searchBar}>
                <Search size={18} className={styles.searchIcon} />
                <input type="text" placeholder="Search everywhere..." className={styles.searchInput} />
                <div className={styles.hotkeyHint}>
                  <kbd className={styles.kbd}>{osKey}</kbd>
                  <span className={styles.plus}>+</span>
                  <kbd className={styles.kbd}>K</kbd>
                </div>
              </div>

              <div className={styles.userSection}>
                <div className={styles.suBadge}>
                  <span className={styles.suPrefix}>SU</span>
                  <div className={styles.suDivider} />
                  <span className={styles.suName}>Eva</span>
                </div>
                <Tooltip content="Выйти из системы">
                  <Button variant="secondary" size="sm" icon={LogOut} />
                </Tooltip>
              </div>
            </div>
          }
        />
        <section className={styles.content}>{children}</section>
      </main>
    </div>
  );
};
