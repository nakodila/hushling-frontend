"use client";

import { useRef, useState } from "react";
import { createSignedUrl } from "@/lib/supabase/signedUrl";
import styles from "./SignedAudioPlayer.module.css";

interface SignedAudioPlayerProps {
  bucket: string;
  path: string;
  ttlSeconds?: number;
  label?: string;
}

const DEFAULT_TTL_SECONDS = 3600;
const BAR_DELAYS = [0, 0.1, 0.2, 0.3, 0.15, 0.25, 0.05, 0.35];

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** A pill-shaped player that lazily mints a signed URL on first play and
 *  re-arms itself if the URL ever errors (e.g. expired). */
export function SignedAudioPlayer({
  bucket,
  path,
  ttlSeconds = DEFAULT_TTL_SECONDS,
  label = "Play",
}: SignedAudioPlayerProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  async function handleToggle() {
    if (url && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      return;
    }

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

  return (
    <div className={styles.wrap}>
      <div className={styles.player}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={handleToggle}
          disabled={loading}
          aria-label={playing ? "Pause" : label}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="4" width="4" height="16" rx="1" />
              <rect x="15" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 4l13 8-13 8V4z" />
            </svg>
          )}
        </button>

        <span className={styles.time}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className={styles.bars} data-playing={playing}>
          {BAR_DELAYS.map((delay, i) => (
            <span key={i} style={{ animationDelay: `${delay}s` }} />
          ))}
        </div>

        <svg
          className={styles.volumeIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <path d="M19 9a5 5 0 0 1 0 6" />
        </svg>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {url && (
        <audio
          ref={audioRef}
          src={url}
          autoPlay
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onError={() => {
            setUrl(null);
            setPlaying(false);
          }}
        />
      )}
    </div>
  );
}
