// Temporary marketing page. TG-001 replaces this with the game itself.

const steps = [
  {
    title: 'Open your stall',
    body: 'Pick a stall language and a region: Valle de Anáhuac, Yucatán or the Andes. Your region decides the goods you start with.',
  },
  {
    title: 'Trade by naming',
    body: 'Ask a neighbour for goods by picking their name in that stall’s language, with audio to help. Every correct name earns the team confianza.',
  },
  {
    title: 'Fill the orders together',
    body: 'Everyone works on one shared set of community orders, like tamales for the fiesta. Finish enough before dusk and the whole market wins.',
  },
];

const pillars = [
  {
    title: 'Cooperate, don’t compete',
    body: 'Everyone wins or loses together, and helping the slowest player is the best strategy.',
  },
  {
    title: 'Language is the currency',
    body: 'Naming a good in your partner’s language earns trust tokens that save the team when time runs short.',
  },
  {
    title: 'Works with no connection',
    body: 'Solo play against bots and pass-and-play on one device are built to run fully offline.',
  },
  {
    title: 'Assumes nothing about players',
    body: 'A player is a name and an animal glyph. No gender field, no gendered avatars, no gendered copy. Pronouns are optional.',
  },
  {
    title: 'Honest about language',
    body: 'Words in Indigenous languages only ship after a native speaker reviews them. Anything unreviewed is clearly labeled en revisión.',
  },
  {
    title: 'Safe by default',
    body: 'There is no free-text chat. Players talk through a wheel of preset phrases, so kids can play with people they don’t know.',
  },
];

const audiences = [
  {
    title: 'Mixed-language groups',
    body: 'Families, classrooms and friends where one person speaks Nahuatl, Maya or Quechua and others speak Spanish or English.',
  },
  {
    title: 'Heritage learners',
    body: 'Kids in the diaspora who hear a grandparent’s language at home and want to start using it.',
  },
  {
    title: 'Anyone with a phone and 15 minutes',
    body: 'A full market day takes about a quarter of an hour, with 2 to 4 players or with bots filling the stalls.',
  },
];

const languages = ['Español', 'English', 'Nāhuatl', 'Maaya t’aan', 'Runasimi'];

export function Landing() {
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <p className="badge">In development</p>
          <h1>Tianguis</h1>
          <p className="lede">
            A co-operative market game. Two to four people who don’t share a language run one market day together,
            win or lose as a team, and leave able to recognize new words in a language of Mexico or the Andes.
          </p>
          <ul className="langs" aria-label="Stall languages">
            {languages.map((lang) => (
              <li key={lang}>{lang}</li>
            ))}
          </ul>
        </div>
      </header>

      <main>
        <section className="wrap intro">
          <p>
            A <em>tianguis</em> is the open-air market that has run across Mesoamerica since before the Spanish
            arrived. In the game, each player runs a stall and the whole group shares one set of community orders, so
            nobody wins at someone else’s expense. Trading is how you play, and naming goods in your partner’s
            language is what makes trades pay off.
          </p>
        </section>

        <section className="wrap" aria-labelledby="how">
          <h2 id="how">How a market day plays</h2>
          <ol className="steps">
            {steps.map((step) => (
              <li key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="note">
            A day runs 8 rounds, from <em>alba</em> to <em>ocaso</em>. Rain, fiestas and harvests shake things up,
            and three missed orders close the market early.
          </p>
        </section>

        <section className="band" aria-labelledby="pillars">
          <div className="wrap">
            <h2 id="pillars">What we’re building toward</h2>
            <div className="grid">
              {pillars.map((p) => (
                <article key={p.title} className="card">
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="wrap" aria-labelledby="who">
          <h2 id="who">Who it’s for</h2>
          <div className="grid">
            {audiences.map((a) => (
              <article key={a.title} className="card plain">
                <h3>{a.title}</h3>
                <p>{a.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="wrap status" aria-labelledby="status">
          <h2 id="status">Where things stand</h2>
          <p>
            Tianguis is in development and not playable yet. The rules, the art and the five-language word lists are
            still being built. Nahuatl, Maya and Quechua words will appear only once native speakers have reviewed
            them, and until then they are marked <em>en revisión</em>. No machine writes text in those languages.
          </p>
          <p>
            When it launches there will be no ads, no accounts, no purchases and no leaderboards. Just a market and the
            people running it.
          </p>
        </section>
      </main>

      <footer className="wrap footer">
        <p>Tianguis · a game in progress</p>
      </footer>
    </>
  );
}
