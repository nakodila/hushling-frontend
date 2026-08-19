"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  DEFAULT_SAMPLE_TIER,
  SAMPLE_TIER_LIST,
  type SampleTierId,
} from "@/lib/reading-sample";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import styles from "./page.module.css";

const minMinutes = Math.min(...SAMPLE_TIER_LIST.map((t) => t.targetMinutes));
const maxMinutes = Math.max(...SAMPLE_TIER_LIST.map((t) => t.targetMinutes));

export default function RecordEntryClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [checking, setChecking] = useState(true);
  const [hasExistingSample, setHasExistingSample] = useState(false);
  const [tier, setTier] = useState<SampleTierId>(DEFAULT_SAMPLE_TIER);
  const [consented, setConsented] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) {
        setChecking(false);
        return;
      }

      const { data } = await supabase
        .from("voice_samples")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;
      setHasExistingSample(!!data);
      setChecking(false);
    }

    check();
    return () => {
      active = false;
    };
  }, []);

  async function handleStart() {
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session expired. Please sign in again.");
      return;
    }

    const consentedAt = new Date().toISOString();
    const params = new URLSearchParams({ tier, consent: consentedAt });
    if (returnTo) params.set("returnTo", returnTo);
    router.push(`/record/session?${params.toString()}`);
  }

  if (checking) {
    return null;
  }

  if (hasExistingSample) {
    return (
      <main className={styles.wrap}>
        <div className={styles.panel}>
          <Label>Voice sample</Label>
          <h1 className={styles.heading}>You&apos;ve already recorded a voice sample</h1>
          <p className={styles.subtext}>
            You can record more segments or replace it from your settings.
          </p>
          <Button href={returnTo || "/home"} variant="primary">
            {returnTo ? "Continue" : "Back to your cabinet"}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.panel}>
        <Label>Voice sample</Label>
        <h1 className={styles.heading}>Record your voice</h1>
        <p className={styles.subtext}>
          Find a quiet room and sit close to your microphone. You&apos;ll read one
          short segment at a time, about {minMinutes} to {maxMinutes} minutes total
          depending on the length you choose below. After each segment you can
          listen back and re-record it before moving on.
        </p>

        <Card className={styles.card}>
          <div className={styles.tiers}>
            {SAMPLE_TIER_LIST.map((t) => (
              <label key={t.id} className={styles.tierOption} data-selected={tier === t.id}>
                <input
                  type="radio"
                  name="tier"
                  value={t.id}
                  checked={tier === t.id}
                  onChange={() => setTier(t.id)}
                  className={styles.tierRadio}
                />
                <span className={styles.tierBody}>
                  <span className={styles.tierLabel}>
                    {t.label} — about {t.targetMinutes} min
                  </span>
                  <span className={styles.tierBlurb}>{t.blurb}</span>
                </span>
              </label>
            ))}
          </div>

          <label className={styles.consent}>
            <input
              type="checkbox"
              checked={consented}
              onChange={(event) => setConsented(event.target.checked)}
              className={styles.consentCheckbox}
            />
            <span>
              I confirm this is my own voice and I consent to creating an AI
              voice model from it
            </span>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <Button
            variant="primary"
            className={styles.submit}
            disabled={!consented}
            onClick={handleStart}
          >
            Start recording
          </Button>
        </Card>
      </div>
    </main>
  );
}
