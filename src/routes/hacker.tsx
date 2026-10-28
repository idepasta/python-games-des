import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { missions, checkStep, blankCount } from "@/lib/missions";

export const Route = createFileRoute("/hacker")({
  head: () => ({
    meta: [
      { title: "Hacker Missions — Python Mystery Game for Kids" },
      { name: "description", content: "Ένα παιχνίδι μυστηρίου: συμπλήρωσε κώδικα Python με input, if/else, print και μεταβλητές για να σπάσεις κλειδαριές." },
      { property: "og:title", content: "Hacker Missions — Python Mystery Game" },
      { property: "og:description", content: "Γίνε hacker: γράψε Python βήμα-βήμα και λύσε το μυστήριο." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Hacker,
});

const KEY = "hacker-progress";

function Hacker() {
  const [done, setDone] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* ignore */ } }, []);
  const finish = (id: string) => setDone((d) => { const n = d.includes(id) ? d : [...d, id]; localStorage.setItem(KEY, JSON.stringify(n)); return n; });

  return (
    <div className="min-h-screen bg-code text-code-foreground font-mono pb-16">
      <header className="border-b border-go/40 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <Link to="/" className="text-sm hover:text-go">← Code the World</Link>
        <span className="text-go text-sm">⭐ {done.length} / {missions.length} αποστολές</span>
      </header>
      {active === null ? (
        <section className="max-w-4xl mx-auto px-4 py-10">
          <h1 className="font-display text-4xl md:text-6xl font-bold text-go">&gt; HACKER_MISSIONS_</h1>
          <p className="mt-4 text-lg">Ένας μυστηριώδης hacker κλείδωσε το εργαστήριο υπολογιστών. Μόνο εσύ μπορείς να τον σταματήσεις, γράφοντας Python! Σε κάθε αποστολή θα πάρεις <b>εργαλεία</b> (κομμάτια εντολών) σκόρπια. Εσύ αποφασίζεις πού πάει το καθένα.</p>
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {missions.map((m, i) => {
              const locked = i > 0 && !done.includes(missions[i - 1]!.id);
              return (
                <button key={m.id} disabled={locked} onClick={() => setActive(i)} className="text-left rounded-xl border-2 border-go/50 p-4 hover:bg-go/10 disabled:opacity-40 disabled:cursor-not-allowed">
                  <div className="text-3xl">{locked ? "🔒" : m.emoji} {done.includes(m.id) && "✅"}</div>
                  <div className="font-display font-bold text-lg mt-1">{m.title}</div>
                </button>
              );
            })}
          </div>
          {done.length === missions.length && <p className="mt-8 text-2xl text-go font-display">🏆 Έσωσες το εργαστήριο! Είσαι πραγματικός Python hacker!</p>}
        </section>
      ) : (
        <MissionView key={active} n={active} onExit={() => setActive(null)} onDone={finish} />
      )}
    </div>
  );
}

function MissionView({ n, onExit, onDone }: { n: number; onExit: () => void; onDone: (id: string) => void }) {
  const m = missions[n]!;
  const [s, setS] = useState(0);
  const step = m.steps[s]!;
  const count = blankCount(step.code);
  const [vals, setVals] = useState<string[]>(() => Array(count).fill(""));
  const [focus, setFocus] = useState(0);
  const [res, setRes] = useState<boolean[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const built = s >= m.steps.length - 1 && res?.every(Boolean);

  const check = () => setRes(checkStep(step, vals));
  const next = () => { const ns = s + 1; const c = blankCount(m.steps[ns]!.code); setS(ns); setVals(Array(c).fill("")); setRes(null); setFocus(0); setShowHint(false); };
  const put = (tool: string) => { setVals((v) => v.map((x, i) => (i === focus ? tool : x))); setRes(null); setFocus((f) => Math.min(count - 1, f + 1)); };

  const parts = step.code.split(/(\[\[\d+\]\])/);
  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <button onClick={onExit} className="text-sm hover:text-go">← Όλες οι αποστολές</button>
      <h2 className="font-display text-3xl font-bold text-go">{m.emoji} {m.title}</h2>
      <p className="border-l-4 border-warn pl-3">{m.story}</p>
      <div className="flex gap-1">{m.steps.map((_, i) => <div key={i} className={`h-2 flex-1 rounded ${i < s || (i === s && built) ? "bg-go" : i === s ? "bg-warn" : "bg-off"}`} />)}</div>
      <div className="rounded-xl border-2 border-go/40 p-4 space-y-4">
        <div><span className="text-warn">ΒΗΜΑ {s + 1}/{m.steps.length}:</span> {step.goal}</div>
        <pre className="rounded-lg bg-background/5 p-4 text-sm md:text-base whitespace-pre-wrap leading-9">
          {parts.map((p, i) => {
            const mt = p.match(/^\[\[(\d+)\]\]$/);
            if (!mt) return <span key={i}>{p}</span>;
            const b = Number(mt[1]); const r = res?.[b];
            return <input key={i} aria-label={`κενό ${b + 1}`} value={vals[b] ?? ""} onFocus={() => setFocus(b)}
              onChange={(e) => { const v = e.target.value; setVals((x) => x.map((y, k) => (k === b ? v : y))); setRes(null); }}
              size={Math.max(4, (vals[b] ?? "").length + 1)} placeholder="___"
              className={`mx-1 rounded px-1 bg-code border-2 outline-none text-center ${r === true ? "border-go text-go" : r === false ? "border-stop text-stop" : focus === b ? "border-warn" : "border-off"}`} />;
          })}
        </pre>
        <div>
          <div className="text-xs opacity-70 mb-2">🧰 Εργαλεία (πάτα ένα για να μπει στο κίτρινο κενό, ή γράψ' το μόνος σου). Προσοχή, μερικά είναι παγίδες!</div>
          <div className="flex flex-wrap gap-2">{step.tools.map((t, i) => <button key={i} onClick={() => put(t)} className="rounded-md border border-cool px-3 py-1 hover:bg-cool/20">{t}</button>)}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={check} className="rounded-lg bg-go text-code px-4 py-2 font-bold">▶ Έλεγχος</button>
          <button onClick={() => setShowHint(true)} className="rounded-lg border border-warn text-warn px-4 py-2">💡 Βοήθεια</button>
        </div>
        {showHint && <div className="text-warn">💡 {step.hint}</div>}
        {res && (res.every(Boolean)
          ? <div className="text-go font-bold">✅ {step.win}</div>
          : <div className="text-stop font-bold">❌ Λάθος! {res.filter(Boolean).length}/{res.length} κενά σωστά. Τα κόκκινα θέλουν διόρθωση.</div>)}
        {res?.every(Boolean) && s < m.steps.length - 1 && <button onClick={next} className="rounded-lg bg-warn text-code px-4 py-2 font-bold">Επόμενο βήμα →</button>}
      </div>
      {built && <Terminal key={m.id} n={n} onWin={() => onDone(m.id)} onExit={onExit} />}
    </main>
  );
}

function Terminal({ n, onWin, onExit }: { n: number; onWin: () => void; onExit: () => void }) {
  const m = missions[n]!;
  const limited = m.id === "alarm";
  const [lines, setLines] = useState<string[]>(["$ python mission.py"]);
  const [text, setText] = useState("");
  const [tries, setTries] = useState(3);
  const [won, setWon] = useState(false);
  const over = won || (limited && tries === 0);
  const run = () => {
    if (over) return;
    const r = m.run(text);
    const extra: string[] = [];
    if (limited && !r.hacked) { const t = tries - 1; setTries(t); extra.push(t === 0 ? "🚨 ALARM!" : `Απομένουν ${t}`); }
    setLines((l) => [...l, m.prompt + text, ...r.lines, ...extra]); setText("");
    if (r.hacked) { setWon(true); onWin(); }
  };
  return (
    <section className="rounded-xl border-2 border-cool p-4 space-y-3">
      <h3 className="font-display text-xl font-bold text-cool">💻 Τρέξε το πρόγραμμά σου</h3>
      <div className="rounded-lg bg-background/5 p-3 text-sm min-h-24">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      {!over && <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex gap-2">
        <span className="self-center text-cool">{m.prompt}</span>
        <input aria-label="είσοδος προγράμματος" autoFocus value={text} onChange={(e) => setText(e.target.value)} className="flex-1 bg-code border-2 border-cool rounded px-2 py-1 outline-none" />
        <button className="rounded-lg bg-cool text-code px-4 font-bold">Enter</button>
      </form>}
      {won && <div className="text-go text-xl font-bold">🔓 HACKED! Η αποστολή ολοκληρώθηκε. <button onClick={onExit} className="underline">Επόμενη αποστολή →</button></div>}
      {limited && tries === 0 && !won && <button onClick={() => { setTries(3); setLines(["$ python mission.py"]); }} className="rounded-lg bg-stop px-4 py-2 font-bold">🔄 Επανεκκίνηση συστήματος</button>}
    </section>
  );
}
