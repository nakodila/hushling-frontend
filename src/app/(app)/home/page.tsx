"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { RenditionCard, type RenditionRow } from "@/components/cabinet/RenditionCard";
import styles from "./page.module.css";

interface RenditionWithLullaby extends RenditionRow {
  lullaby: { title: string } | null;
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [renditions, setRenditions] = useState<RenditionWithLullaby[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("renditions")
        .select("id, status, output_path, error, lullaby:lullabies(title)")
        .order("created_at", { ascending: false });

      if (!active) return;
      setRenditions((data as unknown as RenditionWithLullaby[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return null;
  }

  return (
    <>
      <div className={styles.topbar}>
        <p className={styles.sectionLabel}>Your lullabies</p>
        <Button href="/create" variant="primary">
          Create a new lullaby
        </Button>
      </div>

      <main className={styles.main}>
        <div className={styles.cards}>
          {renditions.map((r) => (
            <RenditionCard key={r.id} rendition={r} title={r.lullaby?.title ?? "Untitled lullaby"} />
          ))}

          <a href="/create" className={styles.ghostCard}>
            <span className={styles.ghostPlus}>+</span>
            <span className={styles.ghostTitle}>Start a new dream</span>
            <span className={styles.ghostText}>Turn tonight&apos;s story into a lullaby</span>
          </a>
        </div>

        <div className={styles.hero} aria-hidden="true">
          <svg className={`${styles.cloud} ${styles.cloud1}`} viewBox="0 0 200 100">
            <ellipse cx="60" cy="60" rx="55" ry="30" fill="#3a3670" />
            <ellipse cx="110" cy="45" rx="45" ry="28" fill="#3a3670" />
            <ellipse cx="150" cy="65" rx="35" ry="22" fill="#3a3670" />
          </svg>
          <svg className={`${styles.cloud} ${styles.cloud2}`} viewBox="0 0 200 100">
            <ellipse cx="60" cy="60" rx="55" ry="30" fill="#2f2b60" />
            <ellipse cx="110" cy="45" rx="45" ry="28" fill="#2f2b60" />
          </svg>
          <svg className={`${styles.cloud} ${styles.cloud3}`} viewBox="0 0 200 100">
            <ellipse cx="60" cy="60" rx="50" ry="28" fill="#332f66" />
            <ellipse cx="120" cy="55" rx="40" ry="24" fill="#332f66" />
          </svg>

          <div className={styles.moonWrap}>
            <svg viewBox="0 0 220 220" width="100%">
              <ellipse cx="110" cy="185" rx="70" ry="16" fill="#2f2b60" opacity=".8" />
              <path
                d="M130 30 a80 80 0 1 0 0 150 a95 95 0 0 1 0 -150 Z"
                fill="var(--butter)"
              />
              <path
                d="M78 96 q9 -9 18 0"
                stroke="#241f47"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M110 96 q9 -9 18 0"
                stroke="#241f47"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="80" cy="112" r="8" fill="var(--blush)" opacity=".55" />
              <circle cx="128" cy="112" r="8" fill="var(--blush)" opacity=".55" />
              <path
                d="M96 118 q8 8 16 0"
                stroke="#241f47"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
              <path d="M60 46 L100 32 L86 66 Z" fill="var(--lavender)" />
              <circle cx="60" cy="46" r="8" fill="var(--lavender)" />
            </svg>
          </div>

          <p className={styles.speech}>shall we dream up something new tonight?</p>
        </div>
      </main>
    </>
  );
}
