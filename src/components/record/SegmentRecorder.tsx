"use client";

import { useEffect, useRef, useState } from "react";
import type { ReadingSegment } from "@/lib/reading-sample";
import { pickSupportedMimeType } from "@/lib/audio";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { ProgressBar } from "@/components/ui/ProgressBar";
import styles from "./SegmentRecorder.module.css";

export interface RecordedClip {
  blob: Blob;
  url: string;
  mimeType: string;
  /** Wall-clock recording time. Reading it back off the blob is unreliable —
   *  Chrome reports Infinity/NaN duration for MediaRecorder-produced webm
   *  until you seek it, and start/stop timing is exact anyway. */
  durationSeconds: number;
}

interface SegmentRecorderProps {
  segments: ReadingSegment[];
  onSubmit: (clips: Map<string, RecordedClip>) => void | Promise<void>;
  submitting: boolean;
  submitError: string | null;
  finishLabel?: string;
}

type RecorderStatus = "idle" | "requesting" | "recording";

export function SegmentRecorder({
  segments,
  onSubmit,
  submitting,
  submitError,
  finishLabel = "Finish and upload",
}: SegmentRecorderProps) {
  const [index, setIndex] = useState(0);
  const [clips, setClips] = useState<Map<string, RecordedClip>>(new Map());
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recordStartRef = useRef(0);

  const segment = segments[index];
  const clip = clips.get(segment.id);
  const isLast = index === segments.length - 1;

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setClips((prev) => {
        prev.forEach((c) => URL.revokeObjectURL(c.url));
        return prev;
      });
    };
  }, []);

  async function startRecording() {
    setMicError(null);
    setStatus("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError("Couldn't access your microphone. Check your browser's permission settings and try again.");
      setStatus("idle");
      return;
    }

    streamRef.current = stream;
    const mimeType = pickSupportedMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const actualType = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: actualType });
      const durationSeconds = (Date.now() - recordStartRef.current) / 1000;
      const url = URL.createObjectURL(blob);

      setClips((prev) => {
        const next = new Map(prev);
        const old = next.get(segment.id);
        if (old) URL.revokeObjectURL(old.url);
        next.set(segment.id, { blob, url, mimeType: actualType, durationSeconds });
        return next;
      });

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStatus("idle");
    };

    recordStartRef.current = Date.now();
    recorder.start();
    mediaRecorderRef.current = recorder;
    setStatus("recording");
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function reRecord() {
    setClips((prev) => {
      const next = new Map(prev);
      const old = next.get(segment.id);
      if (old) URL.revokeObjectURL(old.url);
      next.delete(segment.id);
      return next;
    });
  }

  function handleNext() {
    if (isLast) {
      onSubmit(clips);
      return;
    }
    setIndex((i) => i + 1);
  }

  const completed = segments.filter((s) => clips.has(s.id)).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.progressRow}>
        <Label>
          Segment {index + 1} of {segments.length}
        </Label>
        <ProgressBar value={(completed / segments.length) * 100} />
      </div>

      <Card className={styles.card}>
        <p className={styles.direction}>{segment.direction}</p>
        <p className={styles.text}>{segment.text}</p>

        {micError && <p className={styles.error}>{micError}</p>}

        <div className={styles.controls}>
          {!clip && status !== "recording" && (
            <Button
              variant="primary"
              onClick={startRecording}
              disabled={status === "requesting" || submitting}
            >
              {status === "requesting" ? "Requesting microphone…" : "Record"}
            </Button>
          )}

          {status === "recording" && (
            <Button variant="primary" onClick={stopRecording}>
              Stop
            </Button>
          )}

          {clip && status !== "recording" && (
            <>
              <audio className={styles.player} controls src={clip.url} />
              <div className={styles.clipActions}>
                <Button variant="secondary" onClick={reRecord} disabled={submitting}>
                  Re-record
                </Button>
                <Button variant="primary" onClick={handleNext} disabled={submitting}>
                  {submitting ? "Uploading…" : isLast ? finishLabel : "Next"}
                </Button>
              </div>
            </>
          )}
        </div>

        {submitError && <p className={styles.error}>{submitError}</p>}
      </Card>
    </div>
  );
}
