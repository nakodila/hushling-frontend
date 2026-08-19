"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { removeAllUnderPrefix } from "@/lib/supabase/storageCleanup";
import { deleteAllVoiceData } from "@/lib/supabase/deleteVoiceData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import styles from "./page.module.css";

interface VoiceSampleRow {
  id: string;
  sample_tier: "standard" | "extended";
  status: "uploaded" | "training" | "done" | "failed";
  rvc_model_path: string | null;
}

type ActionStage = "idle" | "confirming" | "working" | "error";

const STATUS_COPY: Record<VoiceSampleRow["status"], string> = {
  uploaded: "Uploaded, waiting to start training…",
  training: "Training your voice… this can take a few minutes.",
  done: "Ready",
  failed: "Training didn't finish successfully",
};

const TIER_COPY: Record<VoiceSampleRow["sample_tier"], string> = {
  standard: "Standard (~5 min)",
  extended: "Extended (~10 min)",
};

export default function SettingsClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [voiceSample, setVoiceSample] = useState<VoiceSampleRow | null>(null);

  const [reRecordStage, setReRecordStage] = useState<ActionStage>("idle");
  const [reRecordStep, setReRecordStep] = useState<string | null>(null);
  const [reRecordError, setReRecordError] = useState<string | null>(null);

  const [deleteStage, setDeleteStage] = useState<ActionStage>("idle");
  const [deleteStep, setDeleteStep] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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
      setUserId(user.id);

      const { data } = await supabase
        .from("voice_samples")
        .select("id, sample_tier, status, rvc_model_path")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;
      setVoiceSample(data);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function handleReRecord() {
    if (!userId || !voiceSample) return;
    setReRecordStage("working");
    setReRecordError(null);

    setReRecordStep("Removing your recorded audio…");
    const { error: storageError } = await removeAllUnderPrefix(
      "voice-samples",
      `${userId}/${voiceSample.id}`
    );
    if (storageError) {
      setReRecordStage("error");
      setReRecordError(
        `Couldn't remove your existing recording: ${storageError.message}. Nothing was changed — you can try again.`
      );
      return;
    }

    setReRecordStep("Removing your voice sample record…");
    const { error: deleteRowError } = await supabase
      .from("voice_samples")
      .delete()
      .eq("id", voiceSample.id);

    if (deleteRowError) {
      setReRecordStage("error");
      setReRecordError(
        `Your recorded audio was removed, but we couldn't remove your voice sample record: ${deleteRowError.message}. Please try again before recording a new sample.`
      );
      return;
    }

    router.push("/record");
  }

  async function handleDeleteAll() {
    if (!userId || !voiceSample) return;
    setDeleteStage("working");
    setDeleteError(null);

    const { error } = await deleteAllVoiceData(userId, voiceSample, setDeleteStep);
    if (error) {
      setDeleteStage("error");
      setDeleteError(error);
      return;
    }

    router.push("/home");
  }

  if (loading) {
    return null;
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.panel}>
        <Label>Settings</Label>
        <h1 className={styles.heading}>Your voice</h1>

        {!voiceSample ? (
          <Card className={styles.card}>
            <p className={styles.subtext}>You haven&apos;t recorded a voice sample yet.</p>
            <Button href="/record" variant="primary">
              Record your voice
            </Button>
          </Card>
        ) : (
          <>
            <Card className={styles.card}>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>Status</span>
                <span className={styles.statusValue}>{STATUS_COPY[voiceSample.status]}</span>
              </div>
              <div className={styles.statusRow}>
                <span className={styles.statusLabel}>Sample length</span>
                <span className={styles.statusValue}>{TIER_COPY[voiceSample.sample_tier]}</span>
              </div>
            </Card>

            <Card className={styles.card}>
              <h2 className={styles.sectionHeading}>Re-record my voice</h2>
              <p className={styles.subtext}>
                Replace your current voice sample with a brand new recording. This deletes
                your existing sample and trains a new voice model from scratch — that takes
                a few minutes, not instant, so give it a little time after you finish
                recording.
              </p>

              {reRecordStage === "idle" && (
                <Button variant="secondary" onClick={() => setReRecordStage("confirming")}>
                  Re-record my voice
                </Button>
              )}

              {reRecordStage === "confirming" && (
                <div className={styles.confirmBlock}>
                  <p className={styles.warning}>
                    This removes your current recording and starts a full retrain — a few
                    minutes, not instant. Continue?
                  </p>
                  <div className={styles.confirmActions}>
                    <Button variant="primary" onClick={handleReRecord}>
                      Yes, re-record
                    </Button>
                    <Button variant="secondary" onClick={() => setReRecordStage("idle")}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {reRecordStage === "working" && (
                <p className={styles.status}>{reRecordStep ?? "Working…"}</p>
              )}

              {reRecordStage === "error" && (
                <div className={styles.confirmBlock}>
                  <p className={styles.error}>{reRecordError}</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setReRecordStage("idle");
                      setReRecordError(null);
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </Card>

            <Card className={styles.card}>
              <h2 className={styles.sectionHeading}>Delete my voice data</h2>
              <p className={styles.subtext}>
                Permanently deletes your recorded voice, your trained voice model, and every
                lullaby generated from it. This cannot be undone.
              </p>

              {deleteStage === "idle" && (
                <Button variant="secondary" onClick={() => setDeleteStage("confirming")}>
                  Delete my voice data
                </Button>
              )}

              {deleteStage === "confirming" && (
                <div className={styles.confirmBlock}>
                  <p className={styles.warning}>
                    Type <strong>delete</strong> below to permanently remove your voice
                    recording, trained model, and generated lullabies.
                  </p>
                  <input
                    className={styles.confirmInput}
                    value={deleteConfirmText}
                    onChange={(event) => setDeleteConfirmText(event.target.value)}
                    placeholder="delete"
                    autoFocus
                  />
                  <div className={styles.confirmActions}>
                    <Button
                      variant="primary"
                      onClick={handleDeleteAll}
                      disabled={deleteConfirmText.trim().toLowerCase() !== "delete"}
                    >
                      Permanently delete
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setDeleteStage("idle");
                        setDeleteConfirmText("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {deleteStage === "working" && (
                <p className={styles.status}>{deleteStep ?? "Working…"}</p>
              )}

              {deleteStage === "error" && (
                <div className={styles.confirmBlock}>
                  <p className={styles.error}>{deleteError}</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setDeleteStage("idle");
                      setDeleteError(null);
                      setDeleteConfirmText("");
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
