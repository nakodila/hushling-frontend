"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import styles from "./page.module.css";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signin") {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (authError) {
        setError(authError.message);
        return;
      }
      router.replace("/home");
      return;
    }

    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (!data.session) {
      setError("Check your email to confirm your account before signing in.");
      return;
    }

    router.replace("/home");
  }

  if (checkingSession) {
    return null;
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.panel}>
        <Label>Hushling</Label>

        <div>
          <h1 className={styles.heading}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className={styles.subtext}>
            {mode === "signin"
              ? "Sign in to hear your lullabies again."
              : "Record your voice once. Sing to them for years."}
          </p>
        </div>

        <Card className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className={styles.input}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                className={styles.input}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <Button type="submit" variant="primary" className={styles.submit} disabled={loading}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
            </Button>

            <button
              type="button"
              className={styles.toggle}
              onClick={() => {
                setError(null);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
            >
              {mode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </form>
        </Card>
      </div>
    </main>
  );
}
