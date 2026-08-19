import type { HTMLAttributes } from "react";
import styles from "./ProgressBar.module.css";

export type ProgressBarProps = Omit<HTMLAttributes<HTMLDivElement>, "role" | "children"> & {
  /** Percentage complete, 0-100. */
  value: number;
};

export function ProgressBar({ value, className, ...rest }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const classes = [styles.track, className].filter(Boolean).join(" ");

  return (
    <div
      className={classes}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      {...rest}
    >
      <div className={styles.fill} style={{ width: `${clamped}%` }} />
    </div>
  );
}
