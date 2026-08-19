"use client";

import { useEffect, useRef, useState } from "react";
import { createSignedUrl } from "@/lib/supabase/signedUrl";
import { Button } from "@/components/ui/Button";
import styles from "./SignedAudioPlayer.module.css";

interface SignedAudioPlayerProps {
  bucket: string;
  path: string;
  ttlSeconds?: number;
  label?: string;
}

const DEFAULT_TTL_SECONDS = 3600;

/** A "Play" button that lazily mints a signed URL and swaps itself for an
 *  audio player, re-arming itself if the URL ever errors (e.g. expired). */
export function SignedAudioPlayer({
  bucket,
  path,
  ttlSeconds = DEFAULT_TTL_SECONDS,
  label = "Play",
}: SignedAudioPlayerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (url && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [url]);

  async function handlePlay() {
    setLoading(true);
    setError(null);

    try {
      const signedUrl = await createSignedUrl(bucket, path, ttlSeconds);
      setUrl(signedUrl);
    } catch {
      setError("Couldn't load audio. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!url) {
    return (
      <div className={styles.wrap}>
        <Button variant="primary" onClick={handlePlay} disabled={loading}>
          {loading ? "Loading…" : label}
        </Button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  return (
    <audio
      ref={audioRef}
      controls
      className={styles.player}
      src={url}
      onError={() => setUrl(null)}
    />
  );
}
