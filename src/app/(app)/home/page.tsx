"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { RenditionCard, type RenditionRow } from "@/components/cabinet/RenditionCard";
import { VoiceStatusBanner, type VoiceSampleRow } from "@/components/cabinet/VoiceStatusBanner";
import styles from "./page.module.css";

interface RenditionWithLullaby extends RenditionRow {
  lullaby: { title: string } | null;
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [renditions, setRenditions] = useState<RenditionWithLullaby[]>([]);
  const [voiceSample, setVoiceSample] = useState<VoiceSampleRow | null>(null);

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

      const [renditionsRes, voiceRes] = await Promise.all([
        supabase
          .from("renditions")
          .select("id, status, output_path, error, lullaby:lullabies(title)")
          .order("created_at", { ascending: false }),
        supabase.from("voice_samples").select("id, status").maybeSingle(),
      ]);

      if (!active) return;
      setRenditions((renditionsRes.data as unknown as RenditionWithLullaby[]) ?? []);
      setVoiceSample(voiceRes.data as VoiceSampleRow | null);
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

        {voiceSample ? (
          <VoiceStatusBanner voiceSample={voiceSample} />
        ) : (
          <div className={styles.noVoice}>
            <p className={styles.noVoiceText}>Record your voice to start creating lullabies.</p>
            <Button href="/record" variant="secondary">
              Record your voice
            </Button>
          </div>
        )}

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
