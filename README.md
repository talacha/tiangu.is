# Tianguis
 
> **Two to four people who don't share a language run one market day together in about 15 minutes, win or lose as a team, and leave able to recognize at least 10 new words in a language of Mexico or the Andes.**
 
A *tianguis* is the open-air market that has run across Mesoamerica since before the Spanish arrived. In the game, each player runs a stall and the whole group shares one set of community orders, so nobody wins at someone else's expense. Trading is how you play, and naming goods in your partner's language is what makes trades pay off.
 
> **Status:** planning. This repository has no application code yet. The setup steps below describe the planned toolchain and will be filled in by the first scaffolding task (TG-001).
 
## Who it's for
 
- **Mixed-language groups:** families, classrooms or friends where one person speaks Nahuatl, Maya or Quechua and others speak Spanish or English.
- **Heritage learners**, such as kids in the diaspora who hear a grandparent's language but don't speak it.
- **Hackathon judges**, who should be able to play a full round on their own phone in 3 minutes, offline, against bots.
## Experience pillars
 
1. **Cooperate, don't compete.** Everyone wins or loses together, and helping the slowest player is the best strategy.
2. **Language is the currency.** Naming a good in the other stall's language earns trust tokens (*confianza*), which save the team when time runs short.
3. **Works with no connection.** Solo play against bots and pass-and-play on one device run fully offline. Only online rooms and Axo's explanations need a network.
4. **Assumes nothing about players.** There's no gender field, no gendered avatars and no gendered copy. Players are a name and an animal glyph, and pronouns are optional free text.
5. **Honest about language.** Indigenous-language text and audio only ship after a native speaker reviews them, and anything unreviewed is visibly labeled *en revisión*.
6. **Safe by default.** There's no free-text chat. Players talk through a wheel of preset phrases, translated into all five languages.
## How the game works (rules v1)
 
- **Players:** 2 to 4. In solo play, bot stalls fill the market up to 3.
- **Day:** 8 rounds, from dawn (*alba*) to dusk (*ocaso*).
- **Stalls:** each player picks a **stall language** (Español, English, Nāhuatl, Maaya t'aan or Runasimi) and a **region** (Valle de Anáhuac, Yucatán or Andes). The region sets the starting goods and what the stall can restock.
- **Goods:** 24 goods, 8 per region. Each card shows a picture, the name in all five languages, a pronunciation button and a short cultural note. Cacao is a wildcard in trades, but not in orders.
- **Orders:** a shared deck of community orders with 3 face up, for example *"Tamales for the fiesta: maíz ×2, chile ×1, frijol ×1"*. Several players can contribute to the same order. Each order expires after 4 rounds; an expired order is a strike, and **3 strikes close the market early**.
- **Each round:**
  1. **Event:** a market-event card is revealed (Rain blocks a good, Fiesta makes orders worth +1, Harvest gives everyone a free restock).
  2. **Actions:** each player takes 1 action: propose a trade, contribute to an order, restock (once per round) or pass.
  3. **Clean-up:** order timers tick down and completed orders score.
- **Language bonus:** when you propose a trade, you pick the right name for each requested good in the receiving stall's language, from 3 picture-free options with audio. Each correct name earns the team **+1 confianza**. Spend 2 to swap a face-up order, or 3 to give an order 2 more rounds.
- **Winning:** complete 4 orders on Easy, 6 on Normal or 8 on Hard before dusk. The recap shows the words practised and the cultural notes unlocked.
## Where AI fits
 
| Job | Online | Offline |
|---|---|---|
| "Consejo" hint and bot decisions | **Jev** `Choice` over the legal actions, with a confidence meter | Greedy planner in a Web Worker |
| Explaining a hint, telling a good's story, narrating the recap | Open-weight models via **OpenRouter**, with Claude Haiku as the fallback, voice Axo, a gender-neutral axolotl vendor, in Spanish or English, quoting only reviewed vocabulary | Pre-written, reviewed note cards bundled in the app |
 
No model generates Nahuatl, Maya or Quechua text. Every Indigenous term Axo uses is checked against the approved glossary on the server, and anything else falls back to template text.
 
## Tech stack (planned)
 
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture, system diagram and service list.

- **App:** Vite + React + TypeScript (`strict`), shipped as an installable PWA.
- **Rules engine:** pure TypeScript with no dependencies, written as a seeded, replayable reducer.
- **Offline:** Workbox caching and IndexedDB for saved games.
- **Translations:** i18next with ICU message format, one catalog per locale (`es`, `en`, `nah`, `yua`, `quz`).
- **Multiplayer:** Supabase Realtime (free tier) channels, with the host as the source of truth.
- **Server:** Vercel functions `/api/move` (Jev) and `/api/explain` (OpenRouter), hosted on Vercel Hobby.
- **Rate limits and metrics:** Upstash Redis (free tier, via the Vercel Marketplace).
- **Tooling:** pnpm, ESLint, Prettier, Vitest and Playwright.
### Planned layout
 
```
src/engine/   pure game logic (never imports React or the browser)
src/app/      UI
src/net/      multiplayer
src/ai/       hint providers (Jev, offline planner)
src/content/  goods, orders, events and cultural notes
src/i18n/     translation catalogs
api/          Vercel functions
```
 
## Getting started (planned)
 
Once the scaffold lands, a clean clone should work with:
 
```sh
nvm use          # Node 22
pnpm install
pnpm dev         # local dev server
pnpm check       # lint, typecheck and unit tests
pnpm build       # production build
```
 
Environment variables, all optional for offline play:
 
| Variable | Used for |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Online rooms |
| `JEV_API_KEY` | `/api/move` hints and online bots (server only) |
| `OPENROUTER_API_KEY` | `/api/explain` Axo explanations through OpenRouter (server only) |
| `EXPLAIN_MODELS` | Comma-separated OpenRouter model slugs overriding the default order (server only) |
| `EXPLAIN_DAILY_BUDGET_USD` | Daily spend cap for `/api/explain`, default 2 (server only) |
| `REVIEW_CODE` | Passcode for the reviewer tool |
| `VITE_HIDE_UNREVIEWED` | Hide languages whose goods aren't fully approved |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Per-room rate limits for `/api/move` and metric counters (server only; set by the Vercel Marketplace integration) |
 
API keys never reach the client.
 
## Roadmap
 
| Milestone | Goal |
|---|---|
| **M0** Foundations | Installable PWA on Vercel with CI, translations and design tokens |
| **M1** Rules engine and offline play | A full market day solo against bots or pass-and-play, with no network |
| **M2** Content and review pipeline | Real goods, orders, events and notes in five languages, with native-speaker review |
| **M3** Online rooms | 2 to 4 devices in one room via a code or QR |
| **M4** AI layer | Jev hints, Axo's explanations via OpenRouter, and graceful offline fallbacks |
| **M5** Inclusion and accessibility | WCAG 2.2 AA, full screen-reader play, gender-neutral copy lint |
| **M6** Demo polish and launch | Judge-ready demo, landing page, credits and privacy-safe metrics |
 
The hackathon cut is M0, M1 and M4, plus a single-room-code version of M3, in Spanish, English and one reviewed Indigenous language.
 
## What we measure
 
The north-star metric is **words carried home**: the number of distinct goods a player correctly identifies, in a language other than their interface language, in the 5-question recap. The launch target is an average of at least 6 per completed session. All metrics are anonymous counters with no accounts, no personal data and an opt-out switch.
 
## Non-goals
 
- No money, real wagering, ads, loot boxes or accounts.
- No free-text chat, and no voice chat in v1.
- No live machine-generated text in Nahuatl, Maya or Quechua.
- No competitive leaderboards in v1.
## Contributing language content
 
Indigenous-language names come from published dictionaries, with sources cited, and start as `draft`. Nothing is machine-translated. A string only ships unlabeled once a native speaker has marked it `approved`, and every translator, reviewer and voice is credited in the app with their consent.
 
## License
 
Not chosen yet. The plan is MIT for the code and CC BY-SA for content, only where contributors agree.