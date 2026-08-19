"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { NavBar } from "@/components/nav/NavBar";
import styles from "./layout.module.css";

const starPositions = [
  { top: "6%", left: "4%" },
  { top: "16%", left: "9%" },
  { top: "28%", left: "3%" },
  { top: "40%", left: "10%" },
  { top: "52%", left: "5%" },
  { top: "64%", left: "8%" },
  { top: "76%", left: "3%" },
  { top: "88%", left: "9%" },
  { top: "10%", left: "92%" },
  { top: "22%", left: "96%" },
  { top: "34%", left: "90%" },
  { top: "46%", left: "95%" },
  { top: "58%", left: "91%" },
  { top: "70%", left: "97%" },
  { top: "82%", left: "92%" },
  { top: "94%", left: "96%" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return null;
  }

  return (
    <div className={styles.shell}>
      <div className={styles.stars} aria-hidden="true">
        {starPositions.map((pos, i) => (
          <div key={i} className={styles.starDot} style={pos} />
        ))}
      </div>
      <div className={styles.content}>
        <NavBar />
        {children}
      </div>
    </div>
  );
}
