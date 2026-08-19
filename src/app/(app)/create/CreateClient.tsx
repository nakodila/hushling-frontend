"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { SAMPLE_TIERS } from "@/lib/reading-sample";
import { useRealtimeRow } from "@/hooks/useRealtimeRow";
import { SignedAudioPlayer } from "@/components/SignedAudioPlayer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import styles from "./page.module.css";

interface CatalogLullaby {
  id: string;
  title: string;
  preview_path: string | null;
}

interface VoiceSampleRow {
  id: string;
  status: "uploaded" | "training" | "done" | "failed";
  sample_tier: "standard" | "extended";
}

const upgradeExtraMinutes =
  SAMPLE_TIERS.extended.targetMinutes - SAMPLE_TIERS.standard.targetMinutes;

export default function CreateClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedLullabyId = searchParams.get("lullaby");

  const [loading, setLoading] = useState(true);
  const [lullabies, setLullabies] = useState<CatalogLullaby[]>([]);
  const [voiceSample, setVoiceSample] = useState<VoiceSampleRow | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const [lullabiesRes, voiceRes] = await Promise.all([
        supabase
          .from("lullabies")
          .select("id, title, preview_path")
          .is("owner_id", null)
          .eq("status", "ready"),
        supabase.from("voice_samples").select("id, status, sample_tier").maybeSingle(),
      ]);

      if (!active) return;
      setLullabies((lullabiesRes.data as CatalogLullaby[]) ?? []);
      setVoiceSample(voiceRes.data as VoiceSampleRow | null);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  function selectLullaby(id: string) {
    router.push(`/create?lullaby=${id}`);
  }

  const recordReturnTo = selectedLullabyId
    ? `/create?lullaby=${selectedLullabyId}`
    : undefined;

  async function requestRendition(voiceSampleId: string) {
    if (!selectedLullabyId) return;
    setRequesting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRequesting(false);
      setError("Your session expired. Please sign in again.");
      return;
    }

    const { error: insertError } = await supabase.from("renditions").insert({
      user_id: user.id,
      lullaby_id: selectedLullabyId,
      voice_sample_id: voiceSampleId,
    });

    setRequesting(false);

    // A unique-constraint violation just means this lullaby was already
    // requested with this voice — treat it as "already requested", not
    // an error, and go straight to the cabinet where it's already visible.
    if (insertError && insertError.code !== "23505") {
      setError(`Couldn't request this lullaby: ${insertError.message}. You can try again.`);
      return;
    }

    router.replace("/home");
  }

  if (loading) {
    return null;
  }

  if (!selectedLullabyId) {
    return (
      <main className={styles.wrap}>
        <div className={styles.panel}>
          <Label>Create a lullaby</Label>
          <h1 className={styles.heading}>Choose a lullaby</h1>

          {lullabies.length === 0 ? (
            <p className={styles.empty}>No lullabies are available yet.</p>
          ) : (
            <div className={styles.grid}>
              {lullabies.map((l) => (
                <Card key={l.id} className={styles.card}>
                  <h3 className={styles.title}>{l.title}</h3>
                  {l.preview_path && (
                    <SignedAudioPlayer
                      bucket="lullaby-assets"
                      path={l.preview_path}
                      label="Preview"
                    />
                  )}
                  <Button variant="primary" onClick={() => selectLullaby(l.id)}>
                    Choose this lullaby
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.panel}>
        <Label>Create a lullaby</Label>

        <VoiceBranch
          voiceSample={voiceSample}
          recordReturnTo={recordReturnTo}
          requesting={requesting}
          error={error}
          onUseExisting={requestRendition}
        />

        <Button variant="secondary" onClick={() => router.push("/create")}>
          Choose a different lullaby
        </Button>
      </div>
    </main>
  );
}

interface VoiceBranchProps {
  voiceSample: VoiceSampleRow | null;
  recordReturnTo: string | undefined;
  requesting: boolean;
  error: string | null;
  onUseExisting: (voiceSampleId: string) => void;
}

function VoiceBranch({
  voiceSample: initialVoiceSample,
  recordReturnTo,
  requesting,
  error,
  onUseExisting,
}: VoiceBranchProps) {
  if (!initialVoiceSample) {
    return <NoVoiceSample recordReturnTo={recordReturnTo} />;
  }

  return (
    <TrackedVoiceBranch
      initialVoiceSample={initialVoiceSample}
      recordReturnTo={recordReturnTo}
      requesting={requesting}
      error={error}
      onUseExisting={onUseExisting}
    />
  );
}

function NoVoiceSample({ recordReturnTo }: { recordReturnTo: string | undefined }) {
  return (
    <div className={styles.statusBlock}>
      <p className={styles.status}>
        You&apos;ll need to record a voice sample before this lullaby can be made.
      </p>
      <Button
        variant="primary"
        href={`/record${recordReturnTo ? `?returnTo=${encodeURIComponent(recordReturnTo)}` : ""}`}
      >
        Record your voice
      </Button>
    </div>
  );
}

function TrackedVoiceBranch({
  initialVoiceSample,
  recordReturnTo,
  requesting,
  error,
  onUseExisting,
}: {
  initialVoiceSample: VoiceSampleRow;
  recordReturnTo: string | undefined;
  requesting: boolean;
  error: string | null;
  onUseExisting: (voiceSampleId: string) => void;
}) {
  const voiceSample = useRealtimeRow<VoiceSampleRow>("voice_samples", initialVoiceSample);
  // Only auto-request if we arrived already waiting on training — landing
  // fresh on an already-'done' sample should still show the deliberate
  // choice below, not fire immediately.
  const wasWaitingRef = useRef(
    initialVoiceSample.status === "uploaded" || initialVoiceSample.status === "training"
  );
  const firedRef = useRef(false);

  useEffect(() => {
    if (wasWaitingRef.current && voiceSample.status === "done" && !firedRef.current) {
      firedRef.current = true;
      onUseExisting(voiceSample.id);
    }
  }, [voiceSample.status, voiceSample.id, onUseExisting]);

  if (voiceSample.status === "uploaded" || voiceSample.status === "training") {
    return <p className={styles.status}>Your voice is still training… this can take a few minutes.</p>;
  }

  if (voiceSample.status === "failed") {
    return (
      <div className={styles.statusBlock}>
        <p className={styles.status}>
          Training your voice didn&apos;t finish successfully.
        </p>
        <Button
          variant="primary"
          href={`/record${recordReturnTo ? `?returnTo=${encodeURIComponent(recordReturnTo)}` : ""}`}
        >
          Record your voice
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.statusBlock}>
      {error && <p className={styles.error}>{error}</p>}
      <Button variant="primary" onClick={() => onUseExisting(voiceSample.id)} disabled={requesting}>
        {requesting ? "Requesting…" : "Use my existing voice"}
      </Button>
      {voiceSample.sample_tier === "standard" && (
        <Button
          variant="secondary"
          href={`/record/upgrade${recordReturnTo ? `?returnTo=${encodeURIComponent(recordReturnTo)}` : ""}`}
        >
          Record {upgradeExtraMinutes} more minutes for better quality
        </Button>
      )}
    </div>
  );
}
