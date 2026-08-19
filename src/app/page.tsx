"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

const starPositions = [
  { top: "8%", left: "12%" },
  { top: "18%", left: "84%" },
  { top: "32%", left: "6%" },
  { top: "10%", left: "46%" },
  { top: "36%", left: "92%" },
  { top: "4%", left: "68%" },
  { top: "26%", left: "58%" },
  { top: "44%", left: "20%" },
  { top: "48%", left: "78%" },
];

const steps = [
  {
    title: "Record your voice",
    text: "Read a short passage aloud — about a minute. That's all Hushling needs to learn how you sound.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="2" width="6" height="12" rx="3" stroke="var(--butter)" strokeWidth="1.6" />
        <path
          d="M5 11a7 7 0 0014 0M12 18v3"
          stroke="var(--butter)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Shape the lullaby",
    text: "Pick a melody, a mood — dreamy, playful, calm — and add names or details that make it theirs.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12c2-6 6-6 8 0s6 6 8 0"
          stroke="var(--butter)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Receive your lullaby",
    text: "In minutes, a full lullaby arrives — sung in your voice — ready to play tonight, and every night after.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l2.6 5.8L21 10l-5 4.4L17.4 21 12 17.7 6.6 21 8 14.4 3 10l6.4-1.2L12 3z"
          stroke="var(--butter)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const samples = [
  {
    title: "Sleep Now, Little Star",
    meta: "2:14 · in Maya's voice, for her son Théo",
    line: { x1: 10, y1: 16, x2: 230, y2: 12 },
    dots: [
      { cx: 10, cy: 16, r: 2 },
      { cx: 46, cy: 10, r: 1.6 },
      { cx: 82, cy: 20, r: 2.2 },
      { cx: 118, cy: 8, r: 1.6 },
      { cx: 154, cy: 18, r: 2 },
      { cx: 190, cy: 12, r: 1.6 },
      { cx: 230, cy: 12, r: 2 },
    ],
  },
  {
    title: "The Quiet Boat",
    meta: "1:58 · in Dara's voice, for twins Nia & Kofi",
    line: { x1: 10, y1: 10, x2: 230, y2: 20 },
    dots: [
      { cx: 10, cy: 10, r: 2 },
      { cx: 50, cy: 20, r: 1.6 },
      { cx: 90, cy: 6, r: 2 },
      { cx: 130, cy: 18, r: 1.6 },
      { cx: 170, cy: 10, r: 2.2 },
      { cx: 200, cy: 22, r: 1.6 },
      { cx: 230, cy: 20, r: 2 },
    ],
  },
];

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 2l9 5-9 5V2z" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session) {
        router.replace("/home");
        return;
      }
      setCheckingSession(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (checkingSession) {
    return null;
  }

  return (
    <>
      <nav className={`${styles.nav} ${styles.wrap}`}>
        <div className={styles.logo}>
          hush<span className={styles.logoAccent}>ling</span>
        </div>
        <div className={styles.navLinks}>
          <a href="#how">How it works</a>
          <a href="#samples">Listen</a>
          <a href="#trust">Privacy</a>
        </div>
        <a href="/login" className={styles.navCta}>
          Start free
        </a>
      </nav>

      <header className={styles.hero}>
        <div className={styles.stars} aria-hidden="true">
          {starPositions.map((pos, i) => (
            <div key={i} className={styles.starDot} style={pos} />
          ))}
        </div>

        {/* Signature element: a crib mobile. Each ornament swings from the
            exact point where its string meets the bar (transform-box:
            fill-box in the CSS), so the sway never clips. */}
        <svg className={styles.mobileHanger} viewBox="0 0 520 170" aria-hidden="true">
          <line
            x1="260"
            y1="0"
            x2="260"
            y2="26"
            stroke="var(--periwinkle)"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <line
            x1="90"
            y1="26"
            x2="430"
            y2="26"
            stroke="var(--periwinkle)"
            strokeWidth="2"
            opacity="0.55"
            strokeLinecap="round"
          />

          <g transform="translate(135,26)">
            <g className={styles.swing}>
              <line x1="0" y1="0" x2="0" y2="58" stroke="var(--periwinkle)" strokeWidth="1.5" opacity="0.5" />
              <g className={styles.ornament} transform="translate(0,80)">
                <path
                  d="M 10 -16 A 19 19 0 1 0 10 16 A 24 24 0 0 1 10 -16 Z"
                  fill="var(--butter)"
                />
              </g>
            </g>
          </g>

          <g transform="translate(240,26)">
            <g className={`${styles.swing} ${styles.swingD1}`}>
              <line x1="0" y1="0" x2="0" y2="42" stroke="var(--periwinkle)" strokeWidth="1.5" opacity="0.5" />
              <g className={`${styles.ornament} ${styles.ornamentD1}`} transform="translate(0,56)">
                <path
                  d="M0,-13 L3.8,-4 L13,-4 L5.6,1.8 L8,10.5 L0,5.2 L-8,10.5 L-5.6,1.8 L-13,-4 L-3.8,-4 Z"
                  fill="var(--blush)"
                />
              </g>
            </g>
          </g>

          <g transform="translate(335,26)">
            <g className={`${styles.swing} ${styles.swingD2}`}>
              <line x1="0" y1="0" x2="0" y2="62" stroke="var(--periwinkle)" strokeWidth="1.5" opacity="0.5" />
              <g className={`${styles.ornament} ${styles.ornamentD2}`} transform="translate(0,76)">
                <ellipse cx="0" cy="2" rx="24" ry="13" fill="var(--cream)" />
                <ellipse cx="14" cy="-5" rx="14" ry="10" fill="var(--cream)" />
                <ellipse cx="-13" cy="-3" rx="12" ry="8" fill="var(--cream)" />
              </g>
            </g>
          </g>

          <g transform="translate(420,26)">
            <g className={`${styles.swing} ${styles.swingD3}`}>
              <line x1="0" y1="0" x2="0" y2="38" stroke="var(--periwinkle)" strokeWidth="1.5" opacity="0.5" />
              <g className={styles.ornament} transform="translate(0,52)">
                <path d="M0,13 C-14,3 -14,-10 0,-3 C14,-10 14,3 0,13 Z" fill="var(--blush)" />
              </g>
            </g>
          </g>
        </svg>

        <div className={styles.wrap}>
          <p className={styles.eyebrow}>a lullaby, sung by you</p>
          <h1 className={styles.heroTitle}>
            Your voice, singing them
            <br />
            <em className={styles.heroAccent}>to sleep</em> — even if you can&apos;t carry a tune
          </h1>
          <p className={styles.heroSub}>
            Record a few seconds of your voice. Choose a mood, a melody, even your child&apos;s
            name in the words. Hushling sings the rest, gently, in a voice they already know.
          </p>
          <div className={styles.heroCtas}>
            <Button href="/login" variant="primary" className={styles.ctaButton}>
              Create your lullaby
            </Button>
            <Button href="#samples" variant="secondary" className={styles.ctaButton}>
              <PlayIcon />
              Listen to a sample
            </Button>
          </div>
        </div>
      </header>

      <section id="how" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>How it works</p>
            <h2 className={styles.sectionTitle}>Three small steps, one quiet ritual</h2>
            <p className={styles.sectionText}>
              No studio, no singing lessons — just your phone and a few quiet minutes.
            </p>
          </div>
          <div className={styles.steps}>
            {steps.map((step) => (
              <div key={step.title} className={styles.step}>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="samples" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.kicker}>Listen</p>
            <h2 className={styles.sectionTitle}>A few lullabies, sung by other parents</h2>
            <p className={styles.sectionText}>Each one made from a one-minute recording.</p>
          </div>
          <div className={styles.samples}>
            {samples.map((sample) => (
              <div key={sample.title} className={styles.sampleCard}>
                <button className={styles.playBtn} aria-label={`Play sample: ${sample.title}`}>
                  <PlayIcon />
                </button>
                <div className={styles.sampleInfo}>
                  <div className={styles.sampleTitle}>{sample.title}</div>
                  <div className={styles.sampleMeta}>{sample.meta}</div>
                  <svg
                    className={styles.constellation}
                    viewBox="0 0 240 32"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1={sample.line.x1}
                      y1={sample.line.y1}
                      x2={sample.line.x2}
                      y2={sample.line.y2}
                    />
                    {sample.dots.map((dot, i) => (
                      <circle key={i} cx={dot.cx} cy={dot.cy} r={dot.r} />
                    ))}
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.trust}>
            <svg className={styles.trustIcon} width="72" height="72" viewBox="0 0 72 72" fill="none">
              <circle cx="36" cy="36" r="34" fill="var(--plum-light)" />
              <path
                d="M36 16l16 7v11c0 12-7 18-16 22-9-4-16-10-16-22V23l16-7z"
                stroke="var(--butter)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <p className={styles.kicker}>Your voice, your rules</p>
              <h2 className={`${styles.sectionTitle} ${styles.trustTitle}`}>
                Recordings stay private, always
              </h2>
              <p className={styles.trustText}>
                A voice is personal — especially a parent&apos;s. Hushling only ever uses your
                recording to make lullabies for you, never to train shared models, and never
                shared with anyone else.
              </p>
              <ul className={styles.trustList}>
                <li>Delete your voice model any time</li>
                <li>Lullabies stay in your account only</li>
                <li>No recording is ever used to train other users&apos; voices</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.testimonial}`}>
        <div className={styles.wrap}>
          <blockquote className={styles.testimonialQuote}>
            &ldquo;My son fell asleep to a song I &apos;sang&apos; about his stuffed elephant. I
            can&apos;t hold a tune to save my life — he&apos;ll never know the difference, and
            honestly, neither can I.&rdquo;
          </blockquote>
          <cite className={styles.testimonialCite}>— Priya, parent of a 2-year-old</cite>
        </div>
      </section>

      <section className={styles.closing}>
        <div className={styles.wrap}>
          <h2 className={`${styles.sectionTitle} ${styles.closingTitle}`}>
            Tonight&apos;s lullaby is a few minutes away
          </h2>
          <p className={styles.closingText}>Record your voice once. Sing to them for years.</p>
          <Button href="/login" variant="primary">
            Create your lullaby
          </Button>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.wrap}>hushling — lullabies, in your own voice</div>
      </footer>
    </>
  );
}
