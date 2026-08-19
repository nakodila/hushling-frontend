import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { ProgressBar } from "@/components/ui/ProgressBar";
import styles from "./page.module.css";

const swatches = [
  { name: "--ink" },
  { name: "--plum" },
  { name: "--plum-light" },
  { name: "--periwinkle" },
  { name: "--butter" },
  { name: "--blush" },
  { name: "--cream" },
];

export default function DesignPreviewPage() {
  return (
    <main className={styles.wrap}>
      <h1 className={styles.heading}>Design preview</h1>

      <section className={styles.section}>
        <Label>Palette</Label>
        <div className={styles.swatches}>
          {swatches.map((swatch) => (
            <div key={swatch.name} className={styles.swatch}>
              <div className={styles.swatchColor} style={{ background: `var(${swatch.name})` }} />
              <span className={styles.swatchName}>{swatch.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <Label>Buttons</Label>
        <div className={styles.row}>
          <Button variant="primary">Create your lullaby</Button>
          <Button variant="secondary">Listen to a sample</Button>
        </div>
      </section>

      <section className={styles.section}>
        <Label>Card</Label>
        <Card>
          <p className={styles.cardText}>
            Read a short passage aloud — about a minute. That&apos;s all Lallababy needs to learn how you sound.
          </p>
        </Card>
      </section>

      <section className={styles.section}>
        <Label>Progress</Label>
        <ProgressBar value={60} aria-label="Recording progress" />
      </section>
    </main>
  );
}
