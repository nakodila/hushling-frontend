"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { NavBar } from "@/components/nav/NavBar";
import styles from "./layout.module.css";

/* Seeded PRNG (mulberry32) so the starfield is random-looking yet identical
   on server and client — Math.random() here would break hydration. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x5eed);
const stars = Array.from({ length: 70 }, () => ({
  size: rand() * 2.4 + 1,
  top: rand() * 100,
  left: rand() * 100,
  duration: rand() * 3 + 2,
  delay: rand() * 4,
}));

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
      <div className={styles.starfield} aria-hidden="true">
        {stars.map((star, i) => (
          <div
            key={i}
            className={styles.star}
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>
      <div className={styles.content}>
        <NavBar />
        {children}
      </div>
      <footer className={styles.footer}>handcrafted lullabies, one hush at a time ✦</footer>
    </div>
  );
}
