# Tianguis: tasks

Each task is sized so one Claude Code session can complete it in one PR. Every task lists what it depends on, what to build, and how to know it's done.

**Conventions**
- **Tooling:** pnpm, TypeScript `strict`, ESLint and Prettier, Vitest for unit tests, Playwright for end-to-end tests.
- **Repo layout:** `src/engine/` holds pure game logic that never imports React or the browser. `src/app/` is the UI, `src/net/` is multiplayer, `src/ai/` holds the hint providers, and `api/` holds the Vercel functions.
- **Every PR:** includes tests and passes `pnpm check`, which runs lint, typecheck and tests.

---

## M0: Foundations

### TG-001 Scaffold the repo
- **Depends on:** nothing
- **Do:**
  - `pnpm create vite tianguis --template react-ts`. Add ESLint (typescript-eslint, react-hooks), Prettier, Vitest with jsdom, and Playwright.
  - Add a `pnpm check` script that runs `eslint . && tsc -b && vitest run`.
  - Set up path aliases: `@engine`, `@app`, `@net`, `@ai`, `@content`.
  - Add `.nvmrc` pinned to Node 22, and `README.md` with the setup steps.
- **Done when:** `pnpm i && pnpm check && pnpm build` passes on a clean clone.

### TG-002 Deploy on Vercel and set up CI
- **Depends on:** TG-001
- **Do:**
  - Connect the repo to a Vercel Hobby project, with preview deploys on each PR.
  - Add a GitHub Actions workflow `ci.yml` that runs `pnpm check` and the Playwright smoke test against the preview URL.
  - Add `vercel.json` with SPA rewrites, excluding `/api/*`.
- **Done when:** a PR gets a preview URL and green CI, and merging to `main` deploys to production.

### TG-003 Make it an installable PWA
- **Depends on:** TG-001
- **Do:**
  - Add `vite-plugin-pwa` with `registerType: 'prompt'` and the manifest:
    - name "Tianguis", short_name "Tianguis"
    - `display: standalone`, `theme_color` from the design tokens
    - icons at 192, 512 and 512-maskable
  - Workbox: precache the app shell and all of `src/content/**`. Use runtime `CacheFirst` for `/audio/*` and `NetworkOnly` for `/api/*`.
  - Add an "Update available" toast that calls `updateSW()`.
- **Done when:** Lighthouse marks the app installable, and in airplane mode a reload still renders.

### TG-004 Set up translations
- **Depends on:** TG-001
- **Do:**
  - Add `i18next`, `react-i18next` and `i18next-icu`.
  - Create one catalog per locale: `src/i18n/{es,en,nah,yua,quz}/common.json`. Ship `es` and `en` complete; the three Indigenous catalogs start with only `language.name`.
  - Fallback chain: `nah`, `yua` and `quz` fall back to `es`, and `es` falls back to `en`. The UI language is separate from the stall language.
  - Write a `scripts/i18n-check.ts` that fails when:
    - a key exists in `es` but not `en`;
    - a placeholder is missing or mismatched;
    - a string uses a gendered Spanish form (see TG-052).
- **Done when:** a language picker switches every string live, and CI runs the i18n check.

### TG-005 Design tokens and base components
- **Depends on:** TG-001
- **Do:**
  - Define CSS custom properties: color, space, radius, font size. Include a light and a dark theme, and test every text/background pair for AA contrast.
  - Use the `Noto Sans` and `Noto Sans Display` fonts from Fontsource, self-hosted so they work offline. They cover saltillo (ꞌ), macrons (ā) and glottal apostrophes.
  - Build these components: `Button`, `Card`, `Sheet` (bottom sheet), `Toast`, `IconButton`, `Badge` (including the "en revisión" variant) and `Avatar` (an animal glyph).
  - Every interactive element is at least 44×44 px.
- **Done when:** a `/kitchen-sink` dev route shows every component in both themes and axe reports zero violations.

### TG-006 Anonymous telemetry with an opt-out
- **Depends on:** TG-002
- **Do:**
  - Add a `track(event, props)` that queues events in IndexedDB and flushes them to `/api/metrics` when online.
  - Allowed events: `session_start`, `trade_proposed{bonus:boolean}`, `order_completed`, `day_end{won, ordersDone}` and `recap_score{correct, total, lang}`.
  - The client sends no IDs. The server buckets events by day.
  - Add a settings toggle, "Compartir estadísticas anónimas", which is on by default and explained in plain words.
- **Done when:** events appear in Vercel logs from `/api/metrics`, and the toggle stops them.

---

## M1: Rules engine and offline play

### TG-010 Engine types and seeded random numbers
- **Depends on:** TG-001
- **Do:**
  - In `src/engine/types.ts`, define:
    - `GoodId`, `RegionId = 'anahuac' | 'yucatan' | 'andes'`
    - `LangCode = 'es' | 'en' | 'nah' | 'yua' | 'quz'`
    - `Stall { id, name, glyph, lang, region, goods: Record<GoodId, number>, isBot }`
    - `Order { id, needs: Record<GoodId, number>, filled: Record<GoodId, number>, reward, roundsLeft }`
    - `GameState { seed, rngState, round, phase, turn, stalls, orders:{faceUp, deck}, eventCard, confianza, strikes, completed, log, settings }`
    - `Action`, a discriminated union: `propose | respond | contribute | restock | pass | spendConfianza`
  - In `src/engine/rng.ts`, implement mulberry32. The RNG state lives **in** `GameState` so the game can be replayed.
- **Done when:** types compile, and the same seed always produces the same sequence of numbers.

### TG-011 Setup and the round state machine
- **Depends on:** TG-010
- **Do:**
  - `createGame(settings, players)` deals 6 starting goods from each region, shuffles the orders and events, and reveals 3 orders.
  - Phases: `event → actions → cleanup`, then the next round, ending at `dayEnd` after round 8 or at 3 strikes.
  - `cleanup` decrements `roundsLeft`; any order that reaches 0 is removed, adds a strike, and is replaced from the deck.
  - Event effects are implemented as pure functions in `src/engine/events.ts`: `blockGood`, `orderBonus`, `freeRestock`, `extraOrder`.
- **Done when:** unit tests cover each phase transition, the 3-strike early close, and every event.

### TG-012 Actions and validation
- **Depends on:** TG-011
- **Do:**
  - `legalActions(state, stallId): Action[]` enumerates every legal action. To keep the list small, trade offers are capped at 2 goods out and 2 goods in.
  - `apply(state, action): GameState` is pure, and throws `IllegalAction` on any invalid input.
  - **Trades:** there are two steps, `propose` and then `respond` (`accept`, `decline`, or one `counter`). Cacao may stand in for any one good on either side of a trade, but never for an order.
  - **Contribute:** move goods from a stall into an order's `filled`. When the order is complete, add its reward to `completed`.
  - **Restock:** draw 1 good from your own region's bag, once per round.
- **Done when:** property tests (fast-check) confirm that goods are conserved and never go negative.

### TG-013 The language bonus
- **Depends on:** TG-012, TG-020 (the goods glossary)
- **Do:**
  - The `propose` action carries `namings: {goodId, chosenLabelId}[]`.
  - `apply` awards +1 `confianza` for each naming where `chosenLabelId === goodId`, **using the receiving stall's language**. A wrong answer has no penalty.
  - `makeNamingQuiz(goodId, lang, rng)` returns the correct option plus 2 distractors from the same region, using only labels with `status ∈ {reviewed, approved}`. If fewer than 3 labels qualify, it falls back to the Spanish labels and sets `bonusEligible=false`.
- **Done when:** tests cover a correct answer, a wrong answer, and an unreviewed language, where no bonus is awarded and the reason is logged.

### TG-014 Spending confianza and ending the day
- **Depends on:** TG-012
- **Do:**
  - `spendConfianza{kind:'swapOrder'|'extendOrder', orderId}` costs 2 or 3.
  - `dayEnd` computes `won = completed >= goal[difficulty]`.
  - It also builds the recap: 5 goods, preferring goods that were named during the day, each quizzed in a language other than the player's UI language.
- **Done when:** tests check that `won` and the recap selection are correct.

### TG-015 The greedy planner bot
- **Depends on:** TG-012
- **Do:**
  - In `src/ai/planner.ts`, score every legal action with this heuristic:
    - +10 per unit that fills an order slot, scaled by `1/roundsLeft`;
    - +6 for a trade that unlocks an order completion within one turn;
    - +3 per confianza earned;
    - −4 for giving away a good that another open order needs;
    - small noise from the seeded RNG, so bots don't all play alike.
  - `pickAction(state, stallId, difficulty)` adds a softmax temperature: high on Easy (more mistakes), low on Hard.
  - Bots answer trade offers by accepting when the trade raises team order coverage.
  - Run it in a Web Worker via Comlink.
- **Done when:** a bot-only game completes in under 200 ms in Node.

### TG-016 UI for hot-seat and solo play
- **Depends on:** TG-005, TG-012, TG-015
- **Screens:**
  - **Lobby:** add players (name, glyph, language, region), add bots, pick a difficulty.
  - **Market:** your stall and goods along the bottom, the 3 order cards at the top, other stalls in a carousel, the event banner, and confianza and strike counters.
  - **Trade sheet:** pick goods to give and to ask for, then the naming quiz for each good you ask for.
  - **Pass-the-device interstitial:** "Turno de {name}. Pasa el dispositivo." It hides the previous player's stall.
  - **Recap.**
- **State:** a Zustand store wraps the engine. The UI only ever dispatches `Action`s.
- **Done when:** Playwright plays a full 2-human-plus-1-bot game with scripted actions to the recap.

### TG-017 Simulation and balancing harness
- **Depends on:** TG-015
- **Do:**
  - `pnpm sim --games 1000 --difficulty normal --players 3` runs bot-only games in Node.
  - It prints win rate, the average number of orders, the strike distribution and the average confianza.
  - It writes CSV output to `sim-out/`.
  - Tune `goal`, the order needs, the timer length and the deck mix until the M1 exit numbers are met. Record the final numbers in `docs/balance.md`.
- **Done when:** the harness runs in CI as a non-blocking job, and the documented numbers meet the targets.

### TG-018 Save and resume offline
- **Depends on:** TG-016
- **Do:**
  - Persist `GameState` to IndexedDB with Dexie after every `apply`, keyed by `gameId`.
  - On app start, offer "Continuar mercado".
  - Version the schema, and drop saves made with an incompatible engine version, after a friendly notice.
- **Done when:** killing the tab mid-game and reopening it restores the exact state.

---

## M2: Content and review pipeline

### TG-020 Goods glossary
- **Depends on:** TG-004
- **Do:**
  - Create `src/content/goods.json`, an array of `{ id, region, icon, names: {es,en,nah,yua,quz: {text, ipa?, status, reviewer?, audio?}} }`.
  - Draft list (a reviewer confirms each one):
    - **Anáhuac:** maíz, frijol, chile, cacao, aguacate, jitomate, calabaza, vainilla.
    - **Yucatán:** miel (melipona), achiote, chaya, henequén, pavo de monte, sal de Celestún, copal, pitahaya.
    - **Andes:** papa, quinua, oca, kiwicha, lana de alpaca, chuño, ají, lúcuma.
  - Claude drafts the `es` and `en` names. The Indigenous names start as `draft` and come from published dictionaries, with the source cited in a `source` field. **Don't machine-translate.**
  - Name the variants in the UI: Nāhuatl (Huasteca or Central, whichever the reviewer speaks), Maaya t'aan (Yucatec) and Runasimi (Southern Quechua, Chanka or Qusqu-Qullaw).
- **Done when:** the JSON schema validates in CI (zod), and every good has `es` and `en` text, an icon and a region.

### TG-021 Orders, events and cultural notes
- **Depends on:** TG-020
- **Do:**
  - `orders.json`: 30 orders. Each has `needs` of 3 to 5 goods, a reward of 1 to 3, a **title rooted in a real dish or use** (tamales, mole, cochinita pibil, papa a la huancaína, chocolate de metate, huipil dye…), and a `cultureNoteId`.
  - `events.json`: 12 events, using the effect ids from TG-011.
  - `notes.json`: 24 notes, 2 to 3 sentences each, in Spanish and English, with sources.
  - Claude drafts the notes, and a person checks every one for accuracy and against stereotypes.
  - Make sure each region has enough goods to fill the orders, and verify that with the simulation (TG-017).
- **Done when:** the schema validates, and the simulation still meets its targets with the real content.

### TG-022 Review status, badge and build flag
- **Depends on:** TG-020, TG-005
- **Do:**
  - `useLabel(goodId, lang)` returns `{text, status}`. The UI shows the `Badge` "en revisión" whenever the status isn't `approved`.
  - Build-time env `VITE_HIDE_UNREVIEWED=true` hides languages that have fewer than 100% approved goods from the language picker.
- **Done when:** toggling the flag changes which languages the picker offers.

### TG-023 Reviewer tool
- **Depends on:** TG-022
- **Do:**
  - Add a `/review?lang=nah` route, unlocked by a reviewer passcode stored in the `REVIEW_CODE` env var and checked by `/api/review-auth`.
  - It lists each string with its source, a correction field, an approve button, and a **record-audio** button that uses MediaRecorder to capture 16 kHz mono Opus.
  - Submissions are saved to Supabase table `review_submissions` and Storage bucket `audio-pending`.
  - A `scripts/pull-reviews.ts` script merges approved items into the content JSON and copies the audio into `public/audio/{lang}/{goodId}.webm`. It opens a PR, so a person always merges it.
- **Done when:** a test reviewer can approve 3 words with audio, and the script produces a correct diff.

### TG-024 Audio playback
- **Depends on:** TG-023
- **Do:**
  - A `useSpeak(goodId, lang)` hook plays recorded audio when it exists.
  - Otherwise it uses Web Speech for `es` and `en` only. For Indigenous languages it never synthesizes; it shows the IPA or a spelled-out hint instead.
  - Preload the audio for goods on screen. All of it is cached by Workbox for offline use.
- **Done when:** audio plays offline after one online visit.

### TG-025 Credits
- **Depends on:** TG-023
- **Do:** a `/creditos` screen generated from the `reviewer` fields and `credits.json`, listing translators, voices, sources and licenses. Contributors choose how their name is shown, and can stay anonymous.
- **Done when:** every approved string's reviewer appears on the screen.

---

## M3: Online rooms

### TG-030 Supabase project and room channels
- **Depends on:** TG-002
- **Do:**
  - Create a Supabase project on the free tier and enable Realtime.
  - Rooms use the channel `room:{code}`. The code is 5 letters from an unambiguous alphabet: no O/0 or I/1.
  - Use Broadcast for intents and state, and Presence for the seat list.
  - `src/net/room.ts` exposes `create()`, `join(code)`, `leave()`, `onState(cb)` and `sendIntent(action)`.
  - Put the anon key in `VITE_SUPABASE_*`. No database tables are needed for play.
- **Done when:** two browsers join the same code and see each other in Presence.

### TG-031 Lobby with QR join
- **Depends on:** TG-030, TG-016
- **Do:**
  - The host's lobby shows the room code and a QR code (`qrcode` package) linking to `https://<app>/r/{code}`.
  - Joiners pick a name, glyph and language. The host assigns regions and fills empty seats with bots, then taps "Abrir el mercado".
- **Done when:** a phone scanning the QR lands in the lobby, joined, within 10 s.

### TG-032 The host is the source of truth
- **Depends on:** TG-030, TG-012
- **Do:**
  - The host runs the engine. Other clients send `intent{action, seatId, nonce}` messages.
  - The host checks that `action ∈ legalActions(state, seat)` and that it's that seat's turn, or that the seat is the one responding to a trade.
  - The host then applies the action and broadcasts `state{version, state}`.
  - Clients render only the latest version they've received and ignore older ones.
  - Hidden information: the host broadcasts **every** stall's goods, because this is a co-op game, so nothing needs redacting.
  - Bot seats run on the host.
- **Done when:** a fuzz test injects random, illegal and duplicate intents across 3 simulated clients, and the state stays consistent.

### TG-033 Host migration
- **Depends on:** TG-032
- **Do:**
  - Every client keeps the last state it received.
  - When Presence shows the host has left, the remaining seat with the earliest `joinedAt` becomes host and rebroadcasts `state{version+1}`.
  - A host that reconnects rejoins as a normal seat.
- **Done when:** killing the host's tab mid-trade lets the game continue within 3 s.

### TG-034 Reconnecting and turn timers
- **Depends on:** TG-032
- **Do:**
  - A seat that disconnects for more than 30 s on its turn auto-passes. The timer can be off, 30 s or 60 s.
  - A seat that rejoins with the same `seatToken`, kept in sessionStorage, reclaims its seat.
- **Done when:** a seat that drops and rejoins gets its stall back.

### TG-035 Preset phrase wheel
- **Depends on:** TG-030, TG-004
- **Do:**
  - Add 12 preset phrases, such as "¿Tienes…?", "Necesito…", "¡Gracias!", "Espera" and "¡Buen trato!".
  - Each phrase is sent as an id and rendered in **each receiver's** language, with audio where it's been recorded.
  - Phrases can attach one good icon.
  - Limit to 1 phrase every 2 s per seat.
- **Done when:** a phrase sent from the `es` seat appears in the `quz` seat's language, or falls back to Spanish with a badge.

---

## M4: AI layer

### TG-040 The `DecisionProvider` interface
- **Depends on:** TG-015
- **Do:**
  - Define `interface DecisionProvider { name: 'jev'|'planner'; pick(state, seat, legal): Promise<{action, confidence, ms}> }`.
  - `HintService` tries `jev` when `navigator.onLine` is true and responds within an 800 ms timeout; otherwise it uses `planner`.
  - The UI labels each hint "Consejo (Jev)" or "Consejo (sin conexión)" and shows the confidence meter. The planner's confidence is its softmax probability.
- **Done when:** a test with the network mocked off falls back cleanly.

### TG-041 Jev spike
- **Depends on:** nothing (can start in parallel with M0)
- **Do:**
  - From docs.typesafe.ai, confirm:
    - the JS SDK package name and its auth;
    - whether it can run in Vercel's Node runtime;
    - the request limits, the free or early-access quota and the latency from a Vercel region;
    - how a `Choice` question is defined: the options and the state payload.
  - Write the findings in `docs/jev.md` with a minimal working call.
- **Done when:** `scripts/jev-smoke.ts` returns a choice and confidence for a toy state.

### TG-042 `/api/move` (Jev)
- **Depends on:** TG-040, TG-041
- **Do:**
  - Create a Vercel function `api/move.ts` that takes `{state: CompactState, seat, legal: ActionSummary[]}`.
  - Compress the state to keep tokens down: per stall, only goods counts; per order, only what's missing; plus round, confianza and strikes.
  - Ask a Jev `Choice` question whose options are the indices of the `legal` actions, and return `{index, confidence}`.
  - Validate the input with zod, cap the body size at 8 KB, and keep the key server-side in `JEV_API_KEY`.
  - Rate-limit to 30 requests per minute per room with `@upstash/ratelimit` (free tier via Vercel Marketplace). Over the limit, return 429 so the client uses the planner.
- **Done when:** the endpoint works from a preview deploy, and an integration test compares Jev's pick with the planner's over 50 states and logs how often they agree.

### TG-043 Bot seats use Jev online
- **Depends on:** TG-042, TG-032
- **Do:**
  - When online, a host-side bot asks `/api/move` with a 600 ms budget and falls back to the planner if it's late.
  - Add a pause of about 1 s before bot moves so humans can follow, with a "bot pensando…" indicator.
- **Done when:** a game with mixed online and offline bots finishes cleanly.

### TG-044 `/api/explain` (Claude as Axo)
- **Depends on:** TG-020, TG-040
- **Do:**
  - Create `api/explain.ts` using `@anthropic-ai/sdk`:
    - model `claude-opus-5-5`, `output_config.effort: "low"`
    - the server-side refusal fallback: beta `server-side-fallback-2026-07-01` with `fallbacks: "default"`
    - streaming
  - **System prompt**, cached with `cache_control`:
    - Axo is a friendly axolotl vendor. Never refer to players with gendered words or pronouns.
    - Reply only in `es` or `en`, in 2 to 3 short sentences.
    - Use Indigenous words **only** from the provided glossary, exactly as written. Never invent or translate Indigenous words.
    - Kid-safe tone.
    - The approved glossary for the session's languages is included as a stable block, so the cache hits.
  - **Per-request input:** the compact state, the hinted action and the player's UI language.
  - Use `client.messages.parse` with `zodOutputFormat({text: string, termsUsed: string[]})`. The server rejects any `termsUsed` term not in the approved glossary and returns the planner's template text instead.
  - Check `stop_reason` before reading content. On `refusal` or any error, return template text.
- **Done when:** 20 sampled explanations use no unapproved Indigenous terms, and `usage.cache_read_input_tokens > 0` from the second call on.

### TG-045 Explanation cache and offline replay
- **Depends on:** TG-044
- **Do:**
  - Store explanations in IndexedDB keyed by `hash(actionKind, goodsInvolved, lang)`.
  - Offline, show the closest cached explanation, or else the bundled cultural note for the good involved.
  - Prefetch notes for every good in the current day when the day starts.
- **Done when:** an online game followed by an airplane-mode game shows Axo's text with no network errors.

### TG-046 Day narration in the recap
- **Depends on:** TG-044, TG-014
- **Do:**
  - Online: one `/api/explain?mode=recap` call writes a 4-sentence story of the market day from the game log, in the player's UI language. The same glossary rules apply.
  - Offline: a template stitches the log into "Hoy completamos {n} pedidos…".
- **Done when:** the recap shows the story online and the template offline.

---

## M5: Inclusion and accessibility

### TG-050 Screen-reader play
- **Depends on:** TG-016
- **Do:**
  - Give every card an accessible name, for example "Maíz, 3 en tu puesto, se necesita para Tamales".
  - Announce turns and trade results in an `aria-live` region.
  - The trade builder is fully keyboard-operable with roving tabindex.
- **Done when:** a full game is completed with VoiceOver on iOS and NVDA on Windows, with notes in `docs/a11y.md`.

### TG-051 Colorblind and low-vision mode
- **Depends on:** TG-005
- **Do:**
  - Each region has its own pattern as well as its color: dots, stripes, zigzag.
  - Text size can scale to 200% without clipping, and there's a high-contrast theme.
  - The interface respects reduced-motion settings.
- **Done when:** a Playwright run at 200% zoom and in high contrast, plus colorblind simulation screenshots, pass review.

### TG-052 Gender-neutral copy lint
- **Depends on:** TG-004
- **Do:**
  - Extend `i18n-check` with a deny-list for `es` (`/\b(jugador|jugadora|bienvenid[oa]|ganador|ganadora|el usuario|la usuaria|amigo|amiga)s?\b/i`, "/a" endings and similar) and suggest neutral rewrites.
  - The game never uses pronouns for players. Optional pronouns are shown only where the player wrote them, on their stall sign.
- **Done when:** CI fails on a seeded gendered string, and the current catalogs pass.

### TG-053 Simple-language mode
- **Depends on:** TG-016
- **Do:**
  - A setting turns on icon-first UI, shorter copy, slower bots and an always-visible "what can I do now" helper.
  - The naming quiz in this mode offers 2 options instead of 3.
- **Done when:** a playtest with a 7-year-old or a first-time player completes the tutorial unaided.

### TG-054 Interactive tutorial
- **Depends on:** TG-016
- **Do:** a scripted 3-round tutorial market with fixed goods and orders that teaches trading, the naming bonus, contributing and confianza. It's skippable and works offline.
- **Done when:** a new player finishes the tutorial in under 2 minutes.

---

## M6: Demo polish and launch

### TG-060 Landing page and share card
- **Depends on:** TG-002
- **Do:** a single landing page with the pitch, a "Jugar ahora" button, an install prompt and credits, plus an Open Graph image.
- **Done when:** sharing the link shows a preview card.

### TG-061 Private metrics dashboard
- **Depends on:** TG-006
- **Do:**
  - `/api/metrics` aggregates daily counts into Upstash.
  - A `/admin` page, behind a passcode, charts the north-star metric and the supporting metrics.
- **Done when:** the north star, words carried home, shows for the last 7 days.

### TG-062 Demo script and fixtures
- **Depends on:** M1 and M4
- **Do:** write `docs/demo.md`, a 3-minute script:
  1. Scan the QR code on two phones.
  2. One stall is Runasimi and one is Español.
  3. Make a trade with the naming quiz, and confianza goes up.
  4. Turn on airplane mode, and a hint still works, from the planner.
  5. Turn the network back on, and Axo explains a move.
  6. Show the recap: words carried home.
  - Add a `?demo=1` seed so the orders always line up.
- **Done when:** the script runs cleanly 5 times in a row.

### TG-063 Load and chaos test
- **Depends on:** TG-033
- **Do:** run 10 rooms of 4 headless clients for 10 games each with random disconnects, and record desyncs and p95 state latency.
- **Done when:** there are zero desyncs, and the p95 broadcast-to-render time is under 400 ms.

### TG-064 Privacy, license and attribution pass
- **Depends on:** TG-025
- **Do:**
  - Write a privacy note in plain language in all five languages, covering what's collected and the opt-out.
  - Pick licenses: MIT for the code, and CC BY-SA for the content **only where the contributors agree**.
  - Get explicit written consent from every reviewer and voice before publishing.
- **Done when:** the consent records are filed and the notice is live.
