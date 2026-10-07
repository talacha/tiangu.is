# Tianguis: north star

> **Two to four people who don't share a language run one market day together in about 15 minutes, win or lose as a team, and leave able to recognize at least 10 new words in a language of Mexico or the Andes.**

A *tianguis* is the open-air market that has run across Mesoamerica since before the Spanish arrived. In the game, each player runs a stall and the whole group shares one set of community orders, so nobody wins at someone else's expense. Trading is how you play, and naming goods in your partner's language is what makes trades pay off.

## Who it's for
- **Mixed-language groups:** families, classrooms or friends where one person speaks Nahuatl, Maya or Quechua and others speak Spanish or English.
- **Heritage learners**, such as kids in the diaspora who hear a grandparent's language but don't speak it.
- **Hackathon judges**, who should be able to play a full round on their own phone in 3 minutes, offline, against bots.

## Experience pillars
1. **Cooperate, don't compete.** Everyone wins or loses together, and helping the slowest player is the best strategy.
2. **Language is the currency.** Naming a good in the other stall's language earns trust tokens, which save the team when time runs short.
3. **Works with no connection.** Solo play against bots and pass-and-play on one device run fully offline. Only online rooms and the Claude explanations need a network.
4. **Assumes nothing about players.** There's no gender field, no gendered avatars and no gendered copy. Players are a name and an animal glyph, and pronouns are optional free text.
5. **Honest about language.** Indigenous-language text and audio only ship after a native speaker reviews them, and anything unreviewed is visibly labeled.
6. **Safe by default.** There's no free-text chat. Players talk through a wheel of preset phrases, translated into all five languages, so kids can play with strangers safely.

## North-star metric
**Words carried home:** the number of distinct goods a player correctly identifies, in a language other than their interface language, in the 5-question recap at the end of the day. Averaged per completed session; target **≥ 6** at launch.

| Supporting metric | Target |
|---|---|
| Sessions that reach the end of the day | ≥ 70% |
| Trades that earn the language bonus | ≥ 40% |
| Time from opening the app to the first trade | < 60 s |
| Full solo game playable in airplane mode | 100% (must-have) |
| Rooms with at least one Indigenous-language stall | ≥ 50% |

These are measured with privacy-safe, anonymous counters: no accounts, no personal data, and an opt-out switch.

## Non-goals
- No money, real wagering, ads, loot boxes or accounts.
- No free-text chat, and no voice chat in v1.
- No live machine-generated text in Nahuatl, Maya or Quechua. Claude speaks Spanish or English and quotes only reviewed vocabulary.
- No competitive leaderboards in v1.

## Game in one page (rules v1)
- **Players:** 2 to 4 people. In solo play, bot stalls fill the market up to 3.
- **Day:** 8 rounds, from dawn (*alba*) to dusk (*ocaso*).
- **Stalls:** each player picks:
  - A **stall language** (Español, English, Nāhuatl, Maaya t'aan or Runasimi), shown on the stall's sign.
  - A **region**: Valle de Anáhuac, Yucatán or Andes. The region decides the starting goods and which goods the stall can restock.
- **Goods:** 24 goods, 8 per region. Each card shows a picture, the name in all five languages, a pronunciation button and a short cultural note. Cacao also works as a wildcard in trades, but not in orders.
- **Orders:** a shared deck of community orders, with 3 face up at a time. For example, *"Tamales for the fiesta: maíz ×2, chile ×1, frijol ×1"*.
  - Several players can contribute goods to the same order across turns.
  - Each order expires after 4 rounds. An expired order is a strike, and **3 strikes close the market early**.
- **Each round:**
  1. **Event:** a market-event card is revealed. Rain blocks one kind of good, Fiesta makes orders worth +1, Harvest gives everyone a free restock.
  2. **Actions:** going around the table, each player takes 1 action:
     - **Propose a trade:** offer goods and ask for goods from one stall. The other player accepts, makes one counter-offer, or declines.
     - **Contribute** goods to an order.
     - **Restock:** draw 1 good from your region. Limited to once per round.
     - **Pass.**
  3. **Clean-up:** order timers tick down, and completed orders score.
- **Language bonus:** when you propose a trade, you must pick the right name for each requested good, in the receiving stall's language, from 3 picture-free options with audio. Each correct name earns the team **+1 confianza**.
  - **2 confianza:** swap out a face-up order.
  - **3 confianza:** give an order 2 more rounds.
- **Winning:** complete the team goal before dusk: 4 orders on Easy, 6 on Normal, 8 on Hard. The recap then shows the words practised and the cultural notes unlocked.

## Where AI fits
| Job | Online | Offline |
|---|---|---|
| **"Consejo" hint** and bot decisions | **Jev** `Choice` over the legal actions, with a confidence meter | Greedy planner in a Web Worker |
| **Explaining a hint**, telling a good's story, narrating the recap | **Claude** voices Axo, a gender-neutral axolotl vendor, in Spanish or English, quoting only reviewed vocabulary | Pre-written, reviewed note cards bundled in the app |
| **Building the game** | Claude Code | n/a |

## Tech in one line
A Vite + React + TypeScript PWA on Vercel Hobby. The rules engine is pure TypeScript with no dependencies, rooms run on Supabase Realtime's free tier, and `/api/move` (Jev) and `/api/explain` (Claude) are Vercel functions. Offline play uses Workbox caching and IndexedDB, and translations use i18next with ICU message format.
