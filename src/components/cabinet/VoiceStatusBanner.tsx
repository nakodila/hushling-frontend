"use client";

import { useRealtimeRow } from "@/hooks/useRealtimeRow";
import { Card } from "@/components/ui/Card";
import styles from "./VoiceStatusBanner.module.css";

export interface VoiceSampleRow {
  id: string;
  status: "uploaded" | "training" | "done" | "failed";
}

interface VoiceStatusBannerProps {
  voiceSample: VoiceSampleRow;
}

export function VoiceStatusBanner({ voiceSample: initialVoiceSample }: VoiceStatusBannerProps) {
  const voiceSample = useRealtimeRow<VoiceSampleRow>("voice_samples", initialVoiceSample);

  if (voiceSample.status === "done") {
    return null;
  }

  return (
    <Card className={styles.banner}>
      {voiceSample.status === "failed" ? (
        <p className={styles.text}>
          Training your voice didn&apos;t finish successfully. Please try recording again.
        </p>
      ) : (
        <p className={styles.text}>Training your voice… this can take a few minutes.</p>
      )}
    </Card>
  );
}
