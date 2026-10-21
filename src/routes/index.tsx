import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lessons } from "@/data/lessons";
import { games } from "@/components/games";
import { ExtrasProvider } from "@/components/game-extras";
import { customizedPython } from "@/lib/extras";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Code the World — Python Games for Kids" },
      { name: "description", content: "10 interactive mini-games showing how everyday machines think in Python." },
      { property: "og:title", content: "Code the World — Python Games for Kids" },
      { property: "og:description", content: "Play with traffic lights, radars and fridges, then read the Python behind them." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [i, setI] = useState(-1);
  const go = (n: number) => { setI(Math.max(-1, Math.min(lessons.length - 1, n))); window.scrollTo({ top: 0 }); };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b-[3px] border-foreground">
        <div className="mx-auto max-w-5xl flex items-center gap-2 overflow-x-auto px-3 py-2">
          <button onClick={() => go(-1)} className={`shrink-0 rounded-lg px-2 py-1 font-display font-bold ${i === -1 ? "bg-primary text-primary-foreground" : ""}`}>🐍</button>
          {lessons.map((l, n) => (
            <button key={n} onClick={() => go(n)} className={`shrink-0 rounded-lg px-2 py-1 text-xl ${i === n ? "bg-primary" : ""}`} aria-label={l.title}>{l.emoji}</button>
          ))}
        </div>
      </header>

      {i === -1 ? <Title onStart={() => go(0)} /> : <LessonView n={i} />}

      <nav className="fixed bottom-0 inset-x-0 bg-background border-t-[3px] border-foreground">
        <div className="mx-auto max-w-5xl flex justify-between items-center p-3">
          <button disabled={i === -1} onClick={() => go(i - 1)} className="press rounded-xl bg-secondary px-4 py-2 font-display font-bold disabled:opacity-30">← Back</button>
          <span className="font-display font-bold">{i + 1} / {lessons.length}</span>
          <button disabled={i === lessons.length - 1} onClick={() => go(i + 1)} className="press rounded-xl bg-primary text-primary-foreground px-4 py-2 font-display font-bold disabled:opacity-30">Next →</button>
        </div>
      </nav>
    </div>
  );
}

function Title({ onStart }: { onStart: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-14 text-center">
      <div className="text-7xl">🐍🤖</div>
      <h1 className="mt-4 text-5xl md:text-7xl font-bold leading-none">Code the World</h1>
      <p className="mt-4 text-lg text-muted-foreground">10 everyday machines. Play the game first, then discover the Python code that makes it think!</p>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {lessons.map((l) => <div key={l.title} className="chunky rounded-xl bg-card p-3 text-3xl">{l.emoji}<div className="text-xs font-display mt-1">{l.title}</div></div>)}
      </div>
      <button onClick={onStart} className="press mt-10 rounded-2xl bg-accent text-accent-foreground px-8 py-4 text-2xl font-display font-bold">Let's play! ▶</button>
    </section>
  );
}

function Code({ title, code }: { title: string; code: string }) {
  return (
    <div className="chunky rounded-2xl bg-code overflow-hidden">
      <div className="px-4 py-2 font-display font-semibold bg-secondary text-secondary-foreground">{title}</div>
      <pre className="p-4 overflow-x-auto font-mono text-xs md:text-sm text-code-foreground"><code>{code}</code></pre>
    </div>
  );
}

function LessonView({ n }: { n: number }) {
  const l = lessons[n]; const Game = games[n];
  if (!l || !Game) return null;
  return (
    <main key={n} className="mx-auto max-w-5xl px-4 py-6 space-y-6 animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center gap-3">
        <span className="text-5xl">{l.emoji}</span>
        <div><div className="font-display text-sm text-muted-foreground">Example {n + 1}</div><h2 className="text-3xl md:text-4xl font-bold leading-tight">{l.title}</h2></div>
      </div>
      <ExtrasProvider key={n} n={n}>{(settings, inputs) => { const py = customizedPython(n, settings, inputs); return (<>
      <div className="grid md:grid-cols-2 gap-6">
        <section className="chunky rounded-2xl bg-card p-5">
          <h3 className="text-xl font-bold mb-2">🔍 How it works in reality</h3>
          <p>{l.how}</p>
        </section>
        <section className="chunky rounded-2xl bg-card p-5">
          <h3 className="text-xl font-bold mb-3">🎮 Play the machine!</h3>
          <Game />
        </section>
      </div>
      <Code title="Phase 1: The Minimal Concept" code={py.p1} />
      <Code title="Phase 2: The Realistic Simulation" code={py.p2} />
      <details className="space-y-4">
        <summary className="cursor-pointer font-display font-semibold">Original Python examples</summary>
        <Code title="Original: The Minimal Concept" code={l.p1} />
        <Code title="Original: The Realistic Simulation" code={l.p2} />
      </details>
      </>); }}</ExtrasProvider>
      {l.concepts.map((c, k) => (
        <div key={k} className="chunky rounded-2xl bg-secondary p-5"><b className="font-display">🧠 CS Concept Unlocked:</b> {c}</div>
      ))}
      <div className="chunky rounded-2xl bg-accent text-accent-foreground p-5"><b className="font-display">🌍 Real-World Glitch:</b> {l.glitch}</div>
    </main>
  );
}
