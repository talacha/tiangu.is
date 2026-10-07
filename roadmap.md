# Tianguis: roadmap

The milestones are ordered so that **something playable exists as early as possible, and it works offline from the start**. Task IDs refer to [tasks.md](tasks.md). The "Hackathon cut" line marks the minimum for a build day; everything after it is the path to a real launch.

## M0: Foundations
**Goal:** an empty but installable PWA deployed on Vercel, with CI, translations and design tokens in place.
**Tasks:** TG-001 to TG-006
**Exit criteria:**
- The production URL installs as an app on Android and iOS and opens offline to a "Hello, tianguis" screen.
- Switching between the five locales changes all copy, and missing keys fail CI.
- Lint, typecheck, unit tests and a Playwright smoke test run green on every PR.

## M1: Rules engine and offline play
**Goal:** a full market day playable solo against bots, or pass-and-play, with no network.
**Tasks:** TG-010 to TG-018
**Exit criteria:**
- The rules engine is a pure reducer with ≥ 90% line coverage. A fixed seed always replays to the same end state.
- The greedy planner bot finishes Normal difficulty at least 50% of the time in a 1,000-game simulation, and Easy at least 80%.
- A solo game started in airplane mode reaches the recap screen, and a saved game resumes after the app is closed.

## M2: Content and review pipeline
**Goal:** real goods, orders, events and cultural notes in all five languages, with a review workflow.
**Tasks:** TG-020 to TG-025
**Exit criteria:**
- 24 goods, 30 orders, 12 events and 24 cultural notes exist in Spanish and English. Each Indigenous-language string has a `status` of `draft`, `reviewed` or `approved`.
- At least one Indigenous language has all 24 goods names **approved by a native speaker**, with audio.
- Unreviewed strings show a visible "en revisión" badge, and a build flag can hide them entirely.

## M3: Online rooms
**Goal:** 2 to 4 people on different devices play the same market day from a room code or QR code.
**Tasks:** TG-030 to TG-035
**Exit criteria:**
- Joining a room from a QR code takes under 10 seconds on 4G.
- If the host drops, play continues: another player becomes host with no lost state.
- Bots fill empty seats. Rooms with 4 phones on hotel Wi-Fi survive 10 consecutive games without desyncing.

## M4: AI layer
**Goal:** Jev hints and bots online, Claude's Axo explanations, and caching so things degrade gracefully offline.
**Tasks:** TG-040 to TG-046
**Exit criteria:**
- The "Consejo" button returns a hint in under 800 ms at p95 online and under 50 ms offline, labeled with which engine produced it.
- An Axo explanation streams in under 3 s, uses only approved vocabulary for Indigenous terms, and is cached for offline replay.
- Turning off the network mid-game switches every AI feature to its offline fallback with no error states.
- API keys never reach the client, and requests are rate-limited per room.

## ── Hackathon cut ──
For a build day, ship M0, M1 and M4, plus M3-lite: one room code, no host migration. Use Spanish, English and **one** reviewed Indigenous language. The demo script is in TG-062.

## M5: Inclusion and accessibility pass
**Goal:** WCAG 2.2 AA, a full screen-reader game, and a gender-neutral copy audit.
**Tasks:** TG-050 to TG-054
**Exit criteria:**
- axe-core reports zero violations across all screens.
- A full game is completable with VoiceOver or TalkBack, and with the keyboard only.
- An automated lint finds no gendered Spanish forms (such as "jugador/a" or "bienvenido") in any catalog.
- Colorblind simulations pass for the goods and stall colors.

## M6: Demo polish and launch
**Goal:** a judge-ready demo, landing page, credits and privacy-safe metrics.
**Tasks:** TG-060 to TG-064
**Exit criteria:**
- The 3-minute demo script runs cleanly 5 times in a row.
- The north-star metric is visible on a private dashboard.
- Credits name every translator, reviewer and voice.

## Dependencies and risks
| Risk | Impact | Mitigation |
|---|---|---|
| No native-speaker reviewer lined up in time | Can't ship Indigenous text honestly | Start outreach in M0 (TG-020). Ship with one language reviewed and the others marked "en revisión". |
| Jev early-access limits or no free tier | Online hints are rate-limited or unavailable | The `DecisionProvider` interface (TG-040) falls back to the planner automatically. Spike it first (TG-041). |
| The economy is too easy or too hard | Boring or frustrating demo | The simulation harness (TG-017) tunes difficulty numerically before any playtest. |
| Supabase public channel abuse | Griefing or cost | Room codes are random and short-lived, and the host checks every intent (TG-032). |
| Claude produces poor Indigenous-language text | Cultural harm | The prompt forbids it, and output is checked against the approved glossary (TG-044). |

## Timeline guide (relative, not dates)
- **Build day:** M0, then M1, then M4, then M3-lite, then the demo.
- **Weeks 1–2 after:** M2 content review, M3 hardening, M5.
- **Week 3:** M6 and launch.
