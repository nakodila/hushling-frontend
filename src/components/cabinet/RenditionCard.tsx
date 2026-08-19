"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRealtimeRow } from "@/hooks/useRealtimeRow";
import { SignedAudioPlayer } from "@/components/SignedAudioPlayer";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import styles from "./RenditionCard.module.css";

export interface RenditionRow {
  id: string;
  status: "queued" | "processing" | "ready" | "failed";
  output_path: string | null;
  error: string | null;
  lullaby_id: string;
  voice_sample_id: string;
}

interface RenditionCardProps {
  rendition: RenditionRow;
  title: string;
  onDeleted: (id: string) => void;
  onRerendered: (id: string, next: RenditionRow) => void;
}

type PendingAction = "delete" | "rerender" | null;

export function RenditionCard({
  rendition: initialRendition,
  title,
  onDeleted,
  onRerendered,
}: RenditionCardProps) {
  const rendition = useRealtimeRow<RenditionRow>("renditions", initialRendition);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canManage = rendition.status === "ready" || rendition.status === "failed";

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (working) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setPendingAction(null);
        setActionError(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen, working]);

  function closeMenu() {
    setMenuOpen(false);
    setPendingAction(null);
    setActionError(null);
  }

  async function handleDelete() {
    setWorking(true);
    setActionError(null);

    if (rendition.output_path) {
      const { error: storageError } = await supabase.storage
        .from("renditions")
        .remove([rendition.output_path]);

      if (storageError) {
        setActionError(`Couldn't remove the audio file: ${storageError.message}. Try again.`);
        setWorking(false);
        return;
      }
    }

    const { error: deleteError } = await supabase.from("renditions").delete().eq("id", rendition.id);

    if (deleteError) {
      setActionError(`Couldn't delete this lullaby: ${deleteError.message}. Try again.`);
      setWorking(false);
      return;
    }

    onDeleted(rendition.id);
  }

  async function handleRerender() {
    setWorking(true);
    setActionError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setActionError("Your session expired. Please sign in again.");
      setWorking(false);
      return;
    }

    if (rendition.output_path) {
      const { error: storageError } = await supabase.storage
        .from("renditions")
        .remove([rendition.output_path]);

      if (storageError) {
        setActionError(`Couldn't remove the current audio: ${storageError.message}. Try again.`);
        setWorking(false);
        return;
      }
    }

    const { error: deleteError } = await supabase.from("renditions").delete().eq("id", rendition.id);

    if (deleteError) {
      setActionError(`Couldn't start the re-render: ${deleteError.message}. Try again.`);
      setWorking(false);
      return;
    }

    const { data: newRow, error: insertError } = await supabase
      .from("renditions")
      .insert({
        user_id: user.id,
        lullaby_id: rendition.lullaby_id,
        voice_sample_id: rendition.voice_sample_id,
      })
      .select("id, status, output_path, error, lullaby_id, voice_sample_id")
      .single();

    if (insertError || !newRow) {
      setActionError(
        `Couldn't start the re-render: ${insertError?.message ?? "unknown error"}. The old version was already removed.`
      );
      setWorking(false);
      return;
    }

    onRerendered(rendition.id, newRow as RenditionRow);
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>

        {canManage && (
          <div className={styles.options} ref={menuRef}>
            <button
              type="button"
              className={styles.optionsBtn}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Lullaby options"
              onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
            >
              ⋮
            </button>

            {menuOpen && (
              <div className={styles.menu} role="menu">
                {working ? (
                  <p className={styles.menuStatus}>
                    {pendingAction === "delete" ? "Deleting…" : "Starting re-render…"}
                  </p>
                ) : pendingAction === "delete" ? (
                  <div className={styles.confirm}>
                    <p className={styles.confirmText}>Delete this lullaby? This can&apos;t be undone.</p>
                    <div className={styles.confirmActions}>
                      <button
                        type="button"
                        className={`${styles.menuItem} ${styles.menuItemDanger}`}
                        role="menuitem"
                        onClick={handleDelete}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className={styles.menuItem}
                        role="menuitem"
                        onClick={() => setPendingAction(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : pendingAction === "rerender" ? (
                  <div className={styles.confirm}>
                    <p className={styles.confirmText}>
                      Re-render this lullaby through the model? The current version will be replaced.
                    </p>
                    <div className={styles.confirmActions}>
                      <button
                        type="button"
                        className={styles.menuItem}
                        role="menuitem"
                        onClick={handleRerender}
                      >
                        Re-render
                      </button>
                      <button
                        type="button"
                        className={styles.menuItem}
                        role="menuitem"
                        onClick={() => setPendingAction(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.menuItem}
                      role="menuitem"
                      onClick={() => setPendingAction("rerender")}
                    >
                      Re-render
                    </button>
                    <div className={styles.menuDivider} />
                    <button
                      type="button"
                      className={`${styles.menuItem} ${styles.menuItemDanger}`}
                      role="menuitem"
                      onClick={() => setPendingAction("delete")}
                    >
                      Delete
                    </button>
                  </>
                )}

                {actionError && <p className={styles.menuError}>{actionError}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {rendition.status === "ready" && rendition.output_path && (
        <SignedAudioPlayer bucket="renditions" path={rendition.output_path} />
      )}

      {(rendition.status === "queued" || rendition.status === "processing") && (
        <Label className={styles.chip}>Creating your lullaby…</Label>
      )}

      {rendition.status === "failed" && (
        <div className={styles.failed}>
          <Label className={styles.chipFailed}>Something went wrong</Label>
          <p className={styles.failedText}>
            {rendition.error ? `${rendition.error} ` : ""}
            Use the options menu above to re-render it.
          </p>
        </div>
      )}
    </Card>
  );
}
