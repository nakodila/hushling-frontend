import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Label.module.css";

export type LabelProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
};

export function Label({ className, children, ...rest }: LabelProps) {
  const classes = [styles.label, className].filter(Boolean).join(" ");
  return (
    <p className={classes} {...rest}>
      {children}
    </p>
  );
}
