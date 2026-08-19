"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { DeleteAccountModal } from "./DeleteAccountModal";
import styles from "./NavBar.module.css";

export function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active || !user) return;
      setUserId(user.id);
      setEmail(user.email ?? null);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  async function handleLogOut() {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
  }

  function handleDeleteAccount() {
    setMenuOpen(false);
    setDeleteModalOpen(true);
  }

  async function handleAccountDeleted() {
    setDeleteModalOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  }

  const initial = (email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <nav className={styles.nav}>
        <a href="/home" className={styles.logo}>
          hush<span className={styles.logoAccent}>ling</span>
        </a>

        <div className={styles.navLinks}>
          <a href="/home" className={pathname === "/home" ? styles.active : undefined}>
            Your lullabies
          </a>
          <a href="/create" className={pathname === "/create" ? styles.active : undefined}>
            Create
          </a>
        </div>

        <div className={styles.account} ref={menuRef}>
          <button
            type="button"
            className={styles.avatarBtn}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {initial}
          </button>

          {menuOpen && (
            <div className={styles.menu} role="menu">
              {email && <p className={styles.menuEmail}>{email}</p>}
              <a href="/settings" className={styles.menuItem} role="menuitem" onClick={() => setMenuOpen(false)}>
                Settings
              </a>
              <button type="button" className={styles.menuItem} role="menuitem" onClick={handleLogOut}>
                Log out
              </button>
              <div className={styles.menuDivider} />
              <button
                type="button"
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                role="menuitem"
                onClick={handleDeleteAccount}
              >
                Delete account
              </button>
            </div>
          )}
        </div>
      </nav>

      {deleteModalOpen && userId && (
        <DeleteAccountModal
          userId={userId}
          onClose={() => setDeleteModalOpen(false)}
          onDeleted={handleAccountDeleted}
        />
      )}
    </>
  );
}
