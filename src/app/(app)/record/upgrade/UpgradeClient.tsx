"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getUpgradeSegments } from "@/lib/reading-sample";
import { extensionForMimeType } from "@/lib/audio";
import { SegmentRecorder, type RecordedClip } from "@/components/record/SegmentRecorder";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

interface ExistingSample {
  id: string;
  storage_path: string;
  sample_tier: string;
  sample_seconds: number;
  consent_confirmed_at: string;
}

export default function UpgradeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/home";

  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<ExistingSample | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("voice_samples")
        .select("id, storage_path, sample_tier, sample_seconds, consent_confirmed_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;
      setExisting(data);
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

  if (!existing) {
    return (
      <main className={styles.wrap}>
        <div className={styles.message}>
          <p>You don&apos;t have a voice sample yet.</p>
          <Button href="/record" variant="primary">
            Record your voice
          </Button>
        </div>
      </main>
    );
  }

  if (existing.sample_tier === "extended") {
    return (
      <main className={styles.wrap}>
        <div className={styles.message}>
          <p>You&apos;ve already recorded the extended sample.</p>
          <Button href={returnTo} variant="primary">
            Continue
          </Button>
        </div>
      </main>
    );
  }

  const segments = getUpgradeSegments("standard", "extended");

  async function handleSubmit(clips: Map<string, RecordedClip>) {
    setSubmitting(true);
    setError(null);

    const current = existing as ExistingSample;
    let addedSeconds = 0;

    for (const seg of segments) {
      const clip = clips.get(seg.id);
      if (!clip) {
        setSubmitting(false);
        setError(`Missing recording for "${seg.id}". Please re-record it.`);
        return;
      }

      const ext = extensionForMimeType(clip.mimeType);
      const { error: uploadError } = await supabase.storage
        .from("voice-samples")
        .upload(`${current.storage_path}/${seg.id}.${ext}`, clip.blob, {
          contentType: clip.mimeType,
          upsert: true,
        });

      if (uploadError) {
        setSubmitting(false);
        setError(`Upload failed: ${uploadError.message}. You can try again.`);
        return;
      }

      addedSeconds += clip.durationSeconds;
    }

    // voice_samples has no UPDATE grant for authenticated users — only the
    // worker can write status/model columns, and a tier change is meant to
    // pay for a fresh training run anyway. So an upgrade is a delete + insert
    // of a new row (same storage_path, old clips untouched, new ones added
    // above), which re-fires the insert-triggered training job. Consent
    // carries forward from the original row rather than being re-asked,
    // since this is the same voice, not a new one.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitting(false);
      setError("Your session expired. Please sign in again.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("voice_samples")
      .delete()
      .eq("id", current.id);

    if (deleteError) {
      setSubmitting(false);
      setError(`Couldn't save your extended sample: ${deleteError.message}. You can try again.`);
      return;
    }

    const { error: insertError } = await supabase.from("voice_samples").insert({
      user_id: user.id,
      storage_path: current.storage_path,
      sample_tier: "extended",
      sample_seconds: current.sample_seconds + Math.round(addedSeconds),
      consent_confirmed_at: current.consent_confirmed_at,
    });

    setSubmitting(false);

    if (insertError) {
      setError(`Couldn't save your extended sample: ${insertError.message}. You can try again.`);
      return;
    }

    router.replace(returnTo);
  }

  return (
    <main className={styles.wrap}>
      <SegmentRecorder
        segments={segments}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={error}
        finishLabel="Finish upgrade"
      />
    </main>
  );
}
