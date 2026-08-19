"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { deleteAllVoiceData } from "@/lib/supabase/deleteVoiceData";
import { Button } from "@/components/ui/Button";
import styles from "./DeleteAccountModal.module.css";

interface VoiceSampleRow {
  id: string;
  rvc_model_path: string | null;
}

type Stage = "loading" | "confirming" | "working" | "error";

interface DeleteAccountModalProps {
  userId: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteAccountModal({ userId, onClose, onDeleted }: DeleteAccountModalProps) {
  const [stage, setStage] = useState<Stage>("loading");
  const [voiceSample, setVoiceSample] = useState<VoiceSampleRow | null>(null);
  const [renditionCount, setRenditionCount] = useState(0);
  const [savedLocally, setSavedLocally] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sample } = await supabase
        .from("voice_samples")
        .select("id, rvc_model_path")
        .eq("user_id", userId)
        .maybeSingle();

      if (!active) return;

      if (!sample) {
        setVoiceSample(null);
        setRenditionCount(0);
        setStage("confirming");
        return;
      }

      const { count } = await supabase
        .from("renditions")
        .select("id", { count: "exact", head: true })
        .eq("voice_sample_id", sample.id);

      if (!active) return;
      setVoiceSample(sample);
      setRenditionCount(count ?? 0);
      setStage("confirming");
    }

    load();
    return () => {
      active = false;
    };
  }, [userId]);

  async function handleConfirm() {
    setStage("working");
    setError(null);

    if (voiceSample) {
      const { error: deleteError } = await deleteAllVoiceData(userId, voiceSample, setStep);
      if (deleteError) {
        setStage("error");
        setError(deleteError);
        return;
      }
    }

    setStep("Signing you out…");
    onDeleted();
  }

  const canConfirm =
    confirmText.trim().toLowerCase() === "delete" && (renditionCount === 0 || savedLocally);

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-account-title" className={styles.title}>
          Delete your account
        </h2>

        {stage === "loading" && <p className={styles.status}>Checking your account…</p>}

        {stage === "confirming" && (
          <div className={styles.body}>
            <p className={styles.warning}>
              This permanently deletes all data saved in this account — your recorded voice,
              your trained voice model, and every lullaby generated from it. This cannot be
              undone.
            </p>

            {renditionCount > 0 && (
              <div className={styles.saveCheck}>
                <p className={styles.warning}>
                  You have {renditionCount} generated {renditionCount === 1 ? "lullaby" : "lullabies"}.
                  Once deleted, they can&apos;t be recovered — make sure you&apos;ve saved any you
                  want to keep to your computer first.
                </p>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={savedLocally}
                    onChange={(event) => setSavedLocally(event.target.checked)}
                  />
                  I&apos;ve saved the lullabies I want to keep
                </label>
              </div>
            )}

            <p className={styles.instruction}>
              Type <strong>delete</strong> below to confirm.
            </p>
            <input
              className={styles.confirmInput}
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="delete"
              autoFocus
            />

            <div className={styles.actions}>
              <Button variant="primary" onClick={handleConfirm} disabled={!canConfirm}>
                Permanently delete my account
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {stage === "working" && <p className={styles.status}>{step ?? "Working…"}</p>}

        {stage === "error" && (
          <div className={styles.body}>
            <p className={styles.error}>{error}</p>
            <div className={styles.actions}>
              <Button
                variant="secondary"
                onClick={() => {
                  setStage("confirming");
                  setError(null);
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
