import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.wrap}>
      <p className={styles.text}>
        You&apos;re signed in. The cabinet lives here soon (Step 5).
      </p>
    </main>
  );
}
