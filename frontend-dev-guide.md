# Lallababy Frontend — Build Guide

This is the only document you need to build the frontend. It supersedes
`old-lullaby-app-build-blueprint.md` and `lalaby-build-blueprint.md` for
frontend purposes — those two stay as historical backend design records,
but nothing here requires opening them again.

## Decisions this guide bakes in

These were open questions as of 2026-08-19; they're settled now so every
step below can just build, not re-litigate:

- **Location:** the frontend lives at `/Users/nakodila/projects/lullaby/frontend/`
  — inside this repo's folder tree, but with its **own** `git init`, its own
  `package.json`, and its own deploy. The outer (backend) repo's
  `.gitignore` excludes `frontend/` entirely, so the two histories never mix
  and the outer repo never sees the frontend as untracked/dirty.
- **Framework:** Next.js (App Router) + `@supabase/supabase-js`, per the
  original blueprint's tech-stack choice — nothing about that has changed.
- **Shared config (`reading-sample.ts`, `config/voice-sample-tiers.json`):**
  vendored — copied into the frontend repo at setup time, not symlinked or
  submoduled. This means the frontend deploys with zero dependency on the
  backend repo. Trade-off you're accepting: if the tier definitions ever
  change, both copies (`worker/rvc_pipeline.py`'s and the frontend's) need
  updating by hand. Given how rarely tier config changes (it's described in
  the blueprint as something that "should never be redeclared," not
  something that gets tuned often), this is the right trade for
  independent deployability.
- **Guest/recruiter link:** Supabase anonymous sign-in
  (`enable_anonymous_sign_ins = true` in `supabase/config.toml`, currently
  `false`), pointed at one pre-seeded demo `profiles` row with sample
  `renditions` already in `ready` status. A recruiter clicking the guest
  link never waits on a GPU job. **This needs one piece of backend work
  that is outside this guide's scope**: flipping the config flag and
  seeding the demo account's data. Step 3 below flags exactly where to do
  that and treats it as a prerequisite, not something the frontend can
  fake around.
- **`voice_samples.storage_path` semantics** (left explicitly unresolved in
  `lalaby-build-blueprint.md` §13 Q6): this guide resolves it as a **folder
  prefix**, `{user_id}/{sample_id}/`, containing one object per script
  segment (`{segment.id}.wav` after client-side conversion, or whatever
  extension `MediaRecorder` produces if you skip conversion — see Step 4).
  This matches what `worker/worker.py` already assumes on the backend side
  per `ACCOMPLISHED.md`, so implementing it this way in the frontend closes
  the loop with zero backend changes required.

## Prerequisites before Step 1

- Node.js + npm available locally.
- The **anon/publishable** Supabase key and project URL for the `Lallababy`
  project (from `.env` at the backend repo root — `SUPABASE_URL` and
  `SUPABASE_PUBLISHABLE_KEY`). **Never** the `SUPABASE_SECRET_KEY` — that
  stays worker-only and must never reach frontend code or a public repo.
- Read access to `frontend/landing/index.html` and
  `frontend/landing/styles.css` for the design system (Steps 1–2 reference
  them directly). These files live inside the frontend project itself, not
  the backend `client/` directory, since the landing-page design is only
  ever needed here. **They are read-only across this entire guide — never
  edit them.**

---

## 1. Scaffold the standalone Next.js project

**Description:** Creates the new, independently-deployable frontend at
`frontend/`, with its own git history and its own dependency tree. Vendors
the tier-config files it needs so it never depends on the backend repo at
build or deploy time. Wires up a Supabase browser client using only the
public anon key. "Done" looks like: `npm run dev` serves a blank Next.js
app, `git log` inside `frontend/` shows one initial commit, and the outer
repo's `git status` shows nothing new under `frontend/`.

**Prompt for Claude Code:**

```
Scaffold a new, independently-deployable Next.js frontend for the Lallababy
lullaby app at /Users/nakodila/projects/lullaby/frontend/.

1. Create the Next.js app (App Router, TypeScript) at that exact path:
   npx create-next-app@latest frontend --typescript --app --src-dir --eslint
   Run it from /Users/nakodila/projects/lullaby so the folder lands at
   /Users/nakodila/projects/lullaby/frontend.

2. Add `frontend/` to the .gitignore at the repo root
   (/Users/nakodila/projects/lullaby/.gitignore) so the outer repo never
   tracks it.

3. Inside frontend/, run `git init` and make an initial commit. This is a
   separate git history from the outer repo — do not add frontend/ to the
   outer repo's git in any way.

4. Install @supabase/supabase-js in frontend/.

5. Create frontend/.env.local.example (committed) and frontend/.env.local
   (gitignored by the Next.js scaffold's own .gitignore) with:
     NEXT_PUBLIC_SUPABASE_URL=
     NEXT_PUBLIC_SUPABASE_ANON_KEY=
   Populate frontend/.env.local's values from SUPABASE_URL and
   SUPABASE_PUBLISHABLE_KEY in /Users/nakodila/projects/lullaby/.env (read
   that file to get the values — do not touch SUPABASE_SECRET_KEY, it must
   never appear in the frontend project).

6. Create frontend/src/lib/supabase/client.ts exporting a browser Supabase
   client built from createBrowserClient (or createClient) using
   process.env.NEXT_PUBLIC_SUPABASE_URL and
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.

7. Vendor the tier-config files: copy
   /Users/nakodila/projects/lullaby/config/voice-sample-tiers.json to
   frontend/src/config/voice-sample-tiers.json, and copy
   /Users/nakodila/projects/lullaby/reading-sample.ts to
   frontend/src/lib/reading-sample.ts, updating its relative import of the
   JSON config to match the new location. Do not modify the two source
   files at the repo root — copy, don't move.

8. Verify: `npm run dev` in frontend/ serves the default Next.js page with
   no errors, and importing { SAMPLE_TIER_LIST, getReadingScript } from
   frontend/src/lib/reading-sample.ts in a scratch component compiles
   cleanly.

Scope boundary: this step only scaffolds the project and vendors config —
no UI, no auth, no pages beyond the Next.js default. Do not build any of
the actual app pages yet.
```

---

## 2. Extract the design system into a shared token/component layer

**Description:** `frontend/landing/index.html` and `styles.css` are the
approved visual identity (the "Lallababy" twilight-nursery theme) but they're
static marketing HTML — nothing in there is reusable by Next.js components
as-is. This step turns the CSS custom properties, type scale, and existing
component patterns (buttons, cards, kickers) into a shared layer the rest of
the app pulls from, so no page re-derives the palette by eye. "Done" looks
like: a `/design-preview` route rendering the token palette, both button
variants, and a card, matching the landing page's look when compared
side-by-side.

**Prompt for Claude Code:**

```
In the Next.js project at /Users/nakodila/projects/lullaby/frontend, build a
shared design-token and base-component layer matching the visual identity
already established in
/Users/nakodila/projects/lullaby/frontend/landing/styles.css and
index.html. Read both files first — they are the source of truth. Do not
edit either file; they stay exactly where they are as a permanent
reference.

1. Create frontend/src/styles/tokens.css defining these CSS custom
   properties on :root, copied exactly from frontend/landing/styles.css:
   --ink:#1B1B3A, --plum:#2E2A4A, --plum-light:#3A3560,
   --periwinkle:#6C6EA0, --butter:#F5DFA6, --blush:#F2C6C2,
   --cream:#FAF6F0, --border-soft:rgba(108,110,160,0.25),
   --border-softer:rgba(250,246,240,0.28),
   --shadow-butter:0 8px 24px rgba(245,223,166,0.18),
   --font-display:'Fraunces',serif, --font-body:'Karla',sans-serif,
   --font-mono:'Space Mono',monospace, --radius-card:20px,
   --radius-pill:100px, --section-pad:clamp(56px,10vw,88px).

2. Load the same three Google Fonts (Fraunces, Karla, Space Mono, same
   weight ranges) as the landing page does, via next/font/google in
   frontend/src/app/layout.tsx rather than a <link> tag (Next.js convention
   for font loading) — match the weights/styles/italics the landing page
   actually uses (Fraunces 400/500/600 + italic 400/500; Karla 400/500/600/700;
   Space Mono 400/700).

3. Set body background to var(--ink) and default text color to var(--cream)
   globally, matching the landing page's dark theme — this is a dark-only
   app, not a light/dark toggle.

4. Build these base components under frontend/src/components/ui/, styled to
   match the landing page's existing classes exactly (reference the
   .btn-primary/.btn-secondary, .step/.sample-card, .kicker/.eyebrow rules
   in styles.css for the precise values):
   - Button.tsx: "primary" variant (butter pill, ink text, box-shadow) and
     "secondary" variant (transparent, cream text, soft border) — mirror
     .btn-primary / .btn-secondary.
   - Card.tsx: plum background, --border-soft border, --radius-card corners,
     padding matching .step's clamp() values.
   - Label.tsx: for kicker/eyebrow-style mono uppercase labels (font-mono,
     0.75-0.78rem, letter-spacing 0.14em, uppercase, butter color).
   - ProgressBar.tsx: new component, not in the landing page — needed for
     the recording flow's segment progress (Step 4). Use --plum-light as
     the track and --butter as the fill, --radius-pill corners, to stay
     consistent with the rest of the palette even though there's no
     existing example to copy.

5. Add a route at frontend/src/app/design-preview/page.tsx rendering the
   full token palette as swatches, both Button variants, one Card, one
   Label, and one ProgressBar at 60%, so the system can be visually
   compared against frontend/landing/index.html side by side.

Scope boundary: only the shared token/component layer and the preview
route. Do not build auth, recording, or any real app page yet — those
components should have no knowledge of Supabase or app data.
```

---

## 3. Auth: login/signup + guest link for recruiters

**Description:** Standard Supabase email/password auth, plus the guest-link
path. Before writing frontend code, this step requires one small backend
change (flip `enable_anonymous_sign_ins` and seed a demo account) — call
this out explicitly to the user rather than silently working around it.
"Done" looks like: a real account can sign up/log in and lands on a
protected route; the guest link signs a visitor in anonymously and routes
them to the same protected shell, seeing the seeded demo data.

**Prompt for Claude Code:**

```
Before writing any frontend code for this step, flag clearly to the user
that it depends on two backend changes that are out of this frontend
project's scope, and confirm they're done (or offer to do them if the user
has backend access in this session):
1. In /Users/nakodila/projects/lullaby/supabase/config.toml, `enable_anonymous_sign_ins`
   under [auth] needs to go from false to true (locally, and the equivalent
   remote-project setting on Lallababy).
2. A demo `profiles` row needs to exist with real, ready `renditions` rows
   already seeded (status='ready', pointing at real files in the
   `renditions` bucket) so a guest sees a populated cabinet immediately.
   Do not seed fake data from the frontend — this is backend seed data.

Then build auth in the Next.js project at
/Users/nakodila/projects/lullaby/frontend, using the Supabase browser
client at frontend/src/lib/supabase/client.ts (from Step 1) and the UI
components from frontend/src/components/ui/ (from Step 2, Button/Card/Label).

1. frontend/src/app/login/page.tsx: email/password sign-up and sign-in
   (supabase.auth.signUp / signInWithPassword), toggled between the two
   modes on one page. Style with the Card/Button components — dark theme,
   matches the landing page's hero centering and spacing conventions
   (see .hero / .wrap in frontend/landing/styles.css for the layout rhythm
   to echo, without copying hero-specific content).

2. A "Try it as a guest" secondary-styled link/button on the same page that
   calls supabase.auth.signInAnonymously() and redirects to the home/cabinet
   route (built in Step 5). This is the recruiter-facing guest link — no
   token, no query param, just anonymous sign-in landing them in the seeded
   demo account's session. If signInAnonymously results in a *new* empty
   anonymous user rather than the seeded demo account, that means the
   Supabase project doesn't yet have a mechanism to route anonymous sessions
   to the shared demo data specifically — stop and flag this back to the
   user rather than inventing a workaround, since it means the backend
   seeding in item 2 above needs to attach demo data to anonymous users
   specifically (e.g. via a trigger matching auth.users.is_anonymous), which
   is a backend decision outside this guide.

3. frontend/src/middleware.ts (or a layout-level check): redirect
   unauthenticated visitors away from any protected route back to /login,
   and redirect authenticated/anonymous sessions away from /login toward
   the home route. Use supabase.auth.getSession() / onAuthStateChange.

4. frontend/src/app/auth/callback/route.ts if using magic-link email
   confirmation — otherwise skip; password-based signup with
   enable_confirmations=false (already the local config's setting) doesn't
   need it.

Scope boundary: only auth and routing. Do not build the cabinet/home page's
actual content (Step 5) or the recording flow (Step 4) — a bare
authenticated placeholder page is enough to verify the redirect works.

Acceptance criteria: a new email/password account can sign up, gets
redirected to the placeholder authenticated route, and a fresh
signInAnonymously() session also lands there. Refreshing the page keeps the
session (Supabase's default local storage persistence).
```

---

## 4. Consent + voice recording flow

**Description:** The core, highest-risk UI: the per-segment recording
experience described in your spec (tier picker → per-segment
instructions/text/record/listen-back/re-record → progress bar → next),
plus the consent capture the database hard-requires
(`voice_samples.consent_confirmed_at not null`) and the upload/insert that
settles the `storage_path` convention from this guide's decisions section.
"Done" looks like: a full run through every segment of a chosen tier
produces uploaded clips under `{user_id}/{sample_id}/` in the
`voice-samples` bucket and one `voice_samples` row with `consent_confirmed_at`
set and `sample_tier` matching the choice.

**Prompt for Claude Code:**

```
Build the voice recording flow in the Next.js project at
/Users/nakodila/projects/lullaby/frontend. This is the highest-stakes page
in the app — read frontend/src/lib/reading-sample.ts in full first (vendored
from the backend repo in Step 1); it is the single source of truth for
segment content, and nothing here should hardcode segment text, count, or
target duration.

1. frontend/src/app/record/page.tsx — entry screen:
   - Short description of the recording process and what to expect (quiet
     room, close to mic, ~5 or ~10 minutes total, one segment at a time,
     re-record any segment before submitting).
   - Tier selector rendering SAMPLE_TIER_LIST from reading-sample.ts (do not
     hardcode "5 min"/"10 min" anywhere — read targetMinutes/blurb per tier
     from the imported list). Default selection = DEFAULT_SAMPLE_TIER.
   - A consent checkbox: "I confirm this is my own voice and I consent to
     creating an AI voice model from it" (exact requirement — see
     old-lullaby-app-build-blueprint.md §8 for why this exact framing
     matters: it's what the consent_confirmed_at timestamp legally
     represents). The "Start recording" button is disabled until checked.
   - On submit, capture the checked timestamp and the chosen tier in local
     component/route state (not yet written to the DB — the DB row is only
     inserted once the recording is actually complete, see step 5 below).

2. frontend/src/app/record/session/page.tsx (or a client component driving
   the same route) — the per-segment recorder, driven entirely by
   getReadingScript(tier):
   - One segment visible at a time: its `direction` (instructions) above
     its `text` (what to read), a Record button using the MediaRecorder API
     (audio/webm or audio/ogg — whatever the browser's MediaRecorder
     supports by default; do not attempt server-side format enforcement
     here, Step 4's backend counterpart already handles non-wav input).
   - After stopping a recording: a listen-back player for that segment's
     clip and a "Re-record" action that discards and re-arms the recorder
     for the same segment. "Next" only enabled once the current segment has
     an accepted clip.
   - A ProgressBar (from frontend/src/components/ui/, Step 2) showing
     segments completed / total segments for the chosen tier.
   - Keep all clips in client-side state (e.g. a Map<segmentId, Blob>) until
     the final segment — do not upload incrementally per segment; upload
     happens once, in bulk, after the last segment, so a user who abandons
     mid-flow leaves no orphaned partial upload.

3. On completing the final segment:
   - Generate a new sample_id (uuid) client-side.
   - Upload every segment's Blob to the `voice-samples` Storage bucket at
     path `{user_id}/{sample_id}/{segment.id}.webm` (or whatever extension
     matches the actual MediaRecorder mimeType — name the file to match,
     do not force a .webm extension on non-webm data). This
     `{user_id}/{sample_id}/` folder-prefix convention is a deliberate
     decision (see frontend-dev-guide.md's "Decisions" section) — follow it
     exactly, since the worker (worker/worker.py, backend repo) already
     assumes storage_path is a folder prefix containing per-segment clips.
   - Insert one row into `voice_samples`: user_id (from the session),
     storage_path = `{user_id}/{sample_id}` (the folder prefix, no trailing
     slash, no filename), sample_tier, sample_seconds (sum of actual clip
     durations, computed client-side from the recorded Blobs), and
     consent_confirmed_at = the timestamp captured in step 1. Do not set
     status explicitly — it defaults to 'uploaded' per the schema.
   - Note: the `unique(user_id)` constraint on voice_samples means a second
     insert for a user who already has a voice sample will fail at the DB
     level — this flow is for a user's *first* recording. The re-record
     case (replacing an existing sample) belongs to the Settings page
     (Step 7), which needs to delete the old row/storage objects first;
     don't handle re-record logic here.
   - On successful insert, redirect to the home/cabinet route (Step 5) —
     the newly 'uploaded' voice_samples row will progress to 'training' via
     the backend trigger + worker automatically; the cabinet page is
     responsible for reflecting that, not this page.

4. frontend/src/app/record/upgrade/page.tsx — the standard→extended upgrade
   variant, reused by Step 6's create-lullaby flow: same per-segment
   recorder component as step 2 above, but driven by
   getUpgradeSegments('standard', 'extended') instead of the full script,
   and on completion it uploads only the new segments into the *existing*
   sample's storage_path folder and updates the existing voice_samples row
   (sample_tier='extended', updated sample_seconds) rather than inserting a
   new row. This is a decision this step makes explicitly: reuse the same
   segment-recorder component/logic from step 2, parameterized by which
   segment list it's given, rather than duplicating the recording UI.

Scope boundary: this step owns everything under /record. It does not touch
the cabinet (Step 5) or create-lullaby (Step 6) beyond the final redirect —
build a bare placeholder destination if those routes don't exist yet.

Acceptance criteria: recording every segment of the 'standard' tier,
listening back, re-recording at least one segment, and submitting produces
exactly 9 objects under voice-samples/{user_id}/{sample_id}/ in Supabase
Storage and one voice_samples row with consent_confirmed_at set and
sample_tier='standard'. Test locally against the local Supabase stack
(supabase start in the backend repo), not production — per this repo's
CLAUDE.md, never test against production without explicit approval.
```

---

## 5. Home / cabinet page

**Description:** The user's landing page after auth — their finished
lullabies with playback, plus in-flight status for anything still
training/rendering, plus the entry point into creating a new one. This is
also where Realtime status handling first appears in the app, so it's worth
building the subscription pattern once here cleanly rather than
copy-pasting it into Step 6 as well.

**Prompt for Claude Code:**

```
Build the home/cabinet page in the Next.js project at
/Users/nakodila/projects/lullaby/frontend, using the Supabase browser client
from frontend/src/lib/supabase/client.ts and the UI components from
frontend/src/components/ui/.

1. frontend/src/app/(app)/home/page.tsx (or wherever your route grouping
   lands post-auth — match whatever protected-route convention Step 3
   established): fetch the current user's `renditions` joined with
   `lullabies` (for title/cover info) via the Supabase client, RLS-scoped
   automatically to auth.uid().

2. Build frontend/src/hooks/useRealtimeRow.ts (or similar): a small reusable
   hook wrapping supabase.channel(...).on('postgres_changes', ...) to
   subscribe to UPDATE events on a given table/row-id, used here for
   `renditions` and reused as-is in Step 6 for `voice_samples`. This is the
   one Realtime subscription pattern the whole app should share — don't
   let Step 6 reimplement it separately.

3. Render each rendition as a card (Card component from Step 2):
   - status='ready': inline audio player. Fetch a short-lived signed URL via
     supabase.storage.from('renditions').createSignedUrl(output_path, ttl)
     — do not construct a public URL, the bucket is private. Re-fetch the
     signed URL on play if it may have expired (don't cache indefinitely).
   - status='queued' or 'processing': a status chip/label ("creating your
     lullaby…") driven by the Realtime subscription from item 2 — the
     initial fetch in item 1 gives the starting state, the subscription
     updates it live without a page refresh.
   - status='failed': a visible failed state with a "try again" action.
     "Try again" means inserting a fresh request for the same
     (lullaby_id, voice_sample_id) pair is safe to retry as-is because of
     the `unique(user_id, lullaby_id, voice_sample_id)` constraint — but a
     'failed' row already occupies that unique slot, so retrying means
     updating the existing row's status back toward re-processing via
     whatever mechanism the backend exposes for that (check
     worker/worker.py's retry/backoff handling in the backend repo — if
     there's no client-safe way to flip a failed rendition back to queued
     under RLS, surface that limitation back to the user rather than
     silently building a button that does nothing; this may need a small
     RLS/RPC addition on the backend side, out of this step's scope to
     invent unilaterally).

4. A prominent "Create a new lullaby" entry point (Button, primary variant)
   routing to the create-lullaby flow (Step 6).

5. Also subscribe to the current user's own `voice_samples` row status here
   (or in a shared layout) so that if a voice is still 'training', that's
   visible on the home page too, not just buried in the create-lullaby flow
   — a user who just finished Step 4's recording and lands here should see
   "training your voice…" immediately.

Scope boundary: only the home/cabinet page and the shared Realtime hook. Do
not build the create-lullaby page's content (Step 6) — a placeholder route
is enough for the "Create a new lullaby" link target.

Acceptance criteria: seed one 'ready' rendition, one 'processing' one, and
one 'failed' one directly in the local Supabase DB and confirm all three
render distinctly; manually flip the 'processing' row's status to 'ready'
via the Studio UI or SQL and confirm the card updates live without a
refresh.
```

---

## 6. Create-lullaby flow

**Description:** The flow in your spec's page 4 — pick a catalog song, then
either record a new voice or reuse an existing trained one, with the
tier-upgrade path folded in. This step is mostly wiring: it reuses the
recorder from Step 4 and the Realtime pattern from Step 5 rather than
introducing new primitives.

**Prompt for Claude Code:**

```
Build the create-lullaby flow in the Next.js project at
/Users/nakodila/projects/lullaby/frontend, reusing the Realtime hook from
frontend/src/hooks/useRealtimeRow.ts (Step 5) and the recorder routes from
Step 4 rather than duplicating logic.

1. frontend/src/app/(app)/create/page.tsx: fetch and display catalog
   lullabies (`lullabies` where owner_id is null and status='ready') as
   selectable cards (Card component), each showing title and, if available,
   a short preview player from preview_path (same signed-URL pattern as
   Step 5's rendition playback — reuse that logic, factor it into a small
   shared helper if it isn't already, e.g.
   frontend/src/lib/supabase/signedUrl.ts).

2. After a lullaby is selected, fetch the current user's `voice_samples` row
   (there's at most one, per the unique(user_id) constraint) and branch:
   - No voice_samples row at all → route straight into the Step 4 recording
     flow (/record), passing the selected lullaby_id through (e.g. via a
     query param or client-side state) so that once the voice finishes
     training, this flow knows which lullaby to request a rendition for.
   - voice_samples.status = 'training' → show a waiting state ("your voice
     is still training…") using the same useRealtimeRow subscription
     pattern from Step 5, with the lullaby selection remembered so the
     rendition request fires automatically the moment status flips to
     'done'.
   - voice_samples.status = 'done' → present two choices: "Use my existing
     voice" (proceeds straight to step 3 below) or, if sample_tier
     ='standard', an additional "Record 5 more minutes for better quality"
     option routing to /record/upgrade (Step 4's upgrade route).
   - voice_samples.status = 'failed' → surface this clearly and offer
     re-recording (routes to the same place as "no voice_samples row",
     understanding the DB insert will need the old row handled first — see
     Step 7's re-record logic; don't duplicate that deletion logic here,
     just route there).

3. Once a lullaby is selected and a 'done' voice sample is confirmed
   available, insert a `renditions` row: user_id, lullaby_id,
   voice_sample_id, status defaults to 'queued'. Rely on the
   unique(user_id, lullaby_id, voice_sample_id) constraint rather than
   checking for an existing row first — if the insert fails on that
   constraint, treat it as "already requested" and just redirect to the
   home/cabinet page (Step 5) where the existing row (whatever its status)
   will already be visible.

4. On successful insert, redirect to the home/cabinet page — the new
   'queued' rendition will show up there and progress via the Realtime
   subscription already built in Step 5. Do not build a separate status
   view here; the cabinet is the single place rendition status is shown.

Scope boundary: this step only wires selection + branching + the
renditions insert. It must not reimplement the recorder (Step 4) or the
Realtime status UI (Step 5) — link/route to them.

Acceptance criteria: selecting a catalog lullaby with no existing voice
sample routes into /record; with a 'done' voice sample, selecting a
lullaby and confirming produces exactly one new renditions row, and
re-confirming the same lullaby a second time does not produce a duplicate
row (verify via the DB directly).
```

---

## 7. Settings: re-record voice and delete voice data

**Description:** The GDPR-erasure and re-record paths flagged as missing
from the original page list — already fully supported on the backend
(RLS + storage policies), but nothing on the frontend surfaces them yet.
"Done" looks like: a user can trigger a full data deletion that actually
empties their storage objects and DB rows, and can trigger a re-record that
cleanly replaces (not duplicates) their existing voice sample.

**Prompt for Claude Code:**

```
Build a settings page in the Next.js project at
/Users/nakodila/projects/lullaby/frontend.

1. frontend/src/app/(app)/settings/page.tsx: shows the current voice
   sample's status/tier if one exists, with two actions:

   a. "Re-record my voice" — this must delete the existing voice_samples
      row and its storage objects *before* routing into the Step 4
      recording flow, since voice_samples has a unique(user_id) constraint
      and a second insert would otherwise fail. Concretely: list and
      remove every object under voice-samples/{user_id}/{old_sample_id}/,
      delete the voice_samples row, and only then redirect to /record.
      Warn the user this triggers a full retrain (a real cost, not
      instant) before they confirm — match the tone/copy style of
      lalaby-build-blueprint.md §10's framing ("this takes a few minutes",
      not implying instant).

   b. "Delete my voice data" — full GDPR-style erasure: remove every object
      under voice-samples/{user_id}/ and voice-models/{user_id}/ (if any
      trained model exists), delete the voice_samples row, and — decide
      explicitly here whether existing renditions made from that voice
      should also be deleted or just orphaned. Recommend: delete them too
      (list and remove voice-samples/renditions objects under
      renditions/{user_id}/ tied to that voice_sample_id, then delete those
      renditions rows), since a rendition is derived entirely from voice
      data the user just asked to erase — keeping the output around after
      deleting the input contradicts the erasure request. Require a typed
      confirmation (e.g. type "delete" into a text field) before the action
      fires, given this is irreversible.

2. Both actions need a loading/confirming state — these are multi-step
   client-side operations (storage list, storage remove, DB delete) that
   can partially fail; if the storage removal succeeds but the DB delete
   fails (or vice versa), show an explicit error rather than a silent
   partial state, and do not redirect away until all steps report success.

Scope boundary: only the settings page and its two actions. Do not modify
RLS policies or storage bucket policies — per ACCOMPLISHED.md these already
grant the necessary owner-scoped delete permissions; if an action fails
with a permission error, that's a signal to stop and report back rather
than trying to work around RLS from the frontend.

Acceptance criteria: on a seeded local test account with a trained voice
sample and at least one rendition, "Delete my voice data" leaves zero
objects under that user's prefix in both the voice-samples and renditions
buckets and zero matching rows in voice_samples/renditions, verified
directly against the local Supabase stack — not production, per this
repo's CLAUDE.md.
```

---

## 8. Deploy

**Description:** Ships the frontend independently of the backend repo,
proving the "deployable separately" requirement actually holds. This is
last because everything before it should already work against the local
Supabase stack; this step only changes where the built app runs, not what
it does.

**Prompt for Claude Code:**

```
Prepare and document deployment of the Next.js project at
/Users/nakodila/projects/lullaby/frontend to Vercel, independent of the
backend repo.

1. Confirm frontend/.gitignore (the Next.js scaffold's own, inside
   frontend/, separate from the outer repo's) excludes .env.local and
   node_modules — verify, don't just assume the create-next-app default is
   unmodified.

2. Document (in frontend/README.md) the two environment variables Vercel's
   project settings need: NEXT_PUBLIC_SUPABASE_URL and
   NEXT_PUBLIC_SUPABASE_ANON_KEY, sourced from the same values used in
   frontend/.env.local — reiterate that the secret/service-role key must
   never be added here.

3. Confirm frontend/ has a real git remote-ready history (from Step 1's
   git init) — do not push anywhere without the user's explicit go-ahead;
   this step should prepare the project to be pushed/connected to Vercel,
   not actually push or deploy on its own. Stop and hand back to the user
   for the actual Vercel project creation / first deploy, since that's an
   action with external, less-reversible effects (creating hosted
   infrastructure, potentially going live) that this guide's own
   instructions call for confirming with the user first.

Scope boundary: preparation and documentation only. Do not create the
Vercel project, do not push to a remote, do not run any deploy command —
hand back to the user at that point.
```
