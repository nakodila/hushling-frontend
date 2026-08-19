"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
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
    <main className={styles.wrap}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <Label>Your lullabies</Label>
          <Button href="/create" variant="primary">
            Create a new lullaby
          </Button>
        </div>

        {renditions.length === 0 ? (
          <p className={styles.empty}>Your lullabies will show up here once they&apos;re ready.</p>
        ) : (
          <div className={styles.grid}>
            {renditions.map((r) => (
              <RenditionCard key={r.id} rendition={r} title={r.lullaby?.title ?? "Untitled lullaby"} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
