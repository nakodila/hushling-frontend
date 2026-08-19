"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getReadingScript, isSampleTierId, type SampleTierId } from "@/lib/reading-sample";
import { extensionForMimeType } from "@/lib/audio";
import { SegmentRecorder, type RecordedClip } from "@/components/record/SegmentRecorder";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

export default function SessionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tierParam = searchParams.get("tier");
  const consent = searchParams.get("consent");
  const tier: SampleTierId | null = tierParam && isSampleTierId(tierParam) ? tierParam : null;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Stable across retries so a failed upload can be safely resubmitted
  // instead of leaving duplicate objects under a second sample id.
  const sampleIdRef = useRef<string | null>(null);

  if (!tier || !consent) {
    return (
      <main className={styles.wrap}>
        <div className={styles.invalid}>
          <p>This recording session is missing its setup details.</p>
          <Button href="/record" variant="primary">
            Start over
          </Button>
        </div>
      </main>
    );
  }

  const segments = getReadingScript(tier);

  async function handleSubmit(clips: Map<string, RecordedClip>) {
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSubmitting(false);
      setError("Your session expired. Please sign in again.");
      return;
    }

    if (!sampleIdRef.current) {
      sampleIdRef.current = crypto.randomUUID();
    }
    const storagePath = `${user.id}/${sampleIdRef.current}`;

    let sampleSeconds = 0;
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
        .upload(`${storagePath}/${seg.id}.${ext}`, clip.blob, {
          contentType: clip.mimeType,
          upsert: true,
        });

      if (uploadError) {
        setSubmitting(false);
        setError(`Upload failed: ${uploadError.message}. You can try again.`);
        return;
      }

      sampleSeconds += clip.durationSeconds;
    }

    const { error: insertError } = await supabase.from("voice_samples").insert({
      id: sampleIdRef.current,
      user_id: user.id,
      storage_path: storagePath,
      sample_tier: tier,
      sample_seconds: Math.round(sampleSeconds),
      consent_confirmed_at: consent,
    });

    setSubmitting(false);

    if (insertError) {
      setError(`Couldn't save your voice sample: ${insertError.message}. You can try again.`);
      return;
    }

    router.replace("/home");
  }

  return (
    <main className={styles.wrap}>
      <SegmentRecorder
        segments={segments}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={error}
        finishLabel="Finish and upload"
      />
    </main>
  );
}
