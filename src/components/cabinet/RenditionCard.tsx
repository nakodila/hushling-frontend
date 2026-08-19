"use client";

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
}

interface RenditionCardProps {
  rendition: RenditionRow;
  title: string;
}

export function RenditionCard({ rendition: initialRendition, title }: RenditionCardProps) {
  const rendition = useRealtimeRow<RenditionRow>("renditions", initialRendition);

  return (
    <Card className={styles.card}>
      <h3 className={styles.title}>{title}</h3>

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
            Retrying isn&apos;t available yet — check back later.
          </p>
        </div>
      )}
    </Card>
  );
}
