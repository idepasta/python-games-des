import { useState } from "react";
import { GameCanvas } from "@/components/game-canvas";
import { MobileFrame } from "@/components/mobile-frame";
import type { PySession } from "@/lib/python-vm";

type Overlay = { kind: "success" | "fail"; text: string } | null;

const RPS_MOVES = [
  { word: "rock", emoji: "🪨", label: "Rock" },
  { word: "paper", emoji: "📄", label: "Paper" },
  { word: "scissors", emoji: "✂️", label: "Scissors" },
] as const;

function rpsMove(text: string) {
  const lower = text.toLowerCase();
  return RPS_MOVES.find((move) => lower.includes(move.word));
}

function rpsLine(text: string) {
  const move = rpsMove(text);
  if (!move || text.includes(move.emoji)) return text;
  return `${move.emoji} ${text}`;
}

const MAD_LIBS_HEROES = [
  { word: "Spider-Man", emoji: "🕷️", label: "Spider-Man" },
  { word: "Batman", emoji: "🦇", label: "Batman" },
  { word: "Deadpool", emoji: "🟥", label: "Deadpool" },
  { word: "Shrek", emoji: "🟢", label: "Shrek" },
  { word: "SpongeBob", emoji: "🧽", label: "SpongeBob" },
  { word: "Pikachu", emoji: "⚡", label: "Pikachu" },
] as const;

const MAD_LIBS_NOUNS = [
  { word: "pizza", emoji: "🍕", label: "pizza" },
  { word: "rubber duck", emoji: "🦆", label: "duck" },
  { word: "skateboard", emoji: "🛹", label: "skate" },
  { word: "boba", emoji: "🧋", label: "boba" },
  { word: "taco", emoji: "🌮", label: "taco" },
  { word: "phone", emoji: "📱", label: "phone" },
] as const;

const MAD_LIBS_VERBS = [
  { word: "moonwalk", emoji: "💃", label: "moonwalk" },
  { word: "yeet", emoji: "💥", label: "yeet" },
  { word: "scream", emoji: "😱", label: "scream" },
  { word: "vibe", emoji: "😎", label: "vibe" },
  { word: "melt", emoji: "🫠", label: "melt" },
  { word: "crash", emoji: "💀", label: "crash" },
] as const;

function madLibsChips(prompt: string) {
  const text = prompt.toLowerCase();
  if (text.includes("verb") || text.includes("💃")) return MAD_LIBS_VERBS;
  if (text.includes("noun") || text.includes("object") || text.includes("🍕")) return MAD_LIBS_NOUNS;
  if (text.includes("name") || text.includes("hero") || text.includes("who")) return MAD_LIBS_HEROES;
  return MAD_LIBS_NOUNS;
}

function MadLibsBoard({ session, onPick }: { session: PySession | null; onPick: (word: string) => void }) {
  const waiting = session?.status === "waiting";
  const chips = madLibsChips(session?.prompt ?? "");
  const noun = session?.inputs[0];
  const verb = session?.inputs[1];
  const story = session?.prints[0];
  return (
    <div className="mb-2 space-y-2">
      <div className="rounded-2xl bg-white/10 p-3 text-center">
        <div className="text-xs uppercase tracking-wide text-white/70">Live news flash</div>
        <div className="mt-1 text-3xl leading-none">🦸📺</div>
        <p className="mt-2 text-sm">
          {story ?? "Tap a picture. The weirder, the better."}
        </p>
        {(noun || verb) && !story ? (
          <p className="mt-1 text-xs text-white/70">
            {noun ? `🍕 ${noun}` : "🍕 object?"} · {verb ? `💃 ${verb}` : "💃 verb?"}
          </p>
        ) : null}
      </div>
      {waiting ? (
        <div className="grid grid-cols-3 gap-2">
          {chips.map((chip) => (
            <button
              key={chip.word}
              type="button"
              onClick={() => onPick(chip.word)}
              className="press rounded-2xl bg-white px-2 py-2 text-slate-900 shadow"
            >
              <span className="block text-3xl leading-none">{chip.emoji}</span>
              <span className="mt-1 block font-display text-xs font-bold">{chip.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const ASCII_CODES = [
  { word: "65", emoji: "A", label: "65" },
  { word: "72", emoji: "H", label: "72" },
  { word: "73", emoji: "I", label: "73" },
  { word: "83", emoji: "S", label: "83" },
] as const;

const ASCII_TEXT = [
  { word: "7", emoji: "7", label: "text 7" },
  { word: "65", emoji: "65", label: "text 65" },
] as const;

const ASCII_PRICES = [
  { word: "2.5", emoji: "2.5", label: "€2.50" },
  { word: "1.25", emoji: "1.25", label: "€1.25" },
  { word: "3.0", emoji: "3.0", label: "€3.00" },
] as const;

function asciiChips(prompt: string) {
  const text = prompt.toLowerCase();
  if (text.includes("price") || text.includes("decimal") || text.includes("float")) return ASCII_PRICES;
  if (text.includes("type 7") || (text.includes("7") && !text.includes("ascii"))) return ASCII_TEXT;
  return ASCII_CODES;
}

function AsciiBoard({ session, onPick }: { session: PySession | null; onPick: (word: string) => void }) {
  const waiting = session?.status === "waiting";
  const chips = asciiChips(session?.prompt ?? "");
  const lastPrint = session?.prints[session.prints.length - 1];
  return (
    <div className="mb-2 space-y-2">
      <div className="rounded-2xl bg-white/10 p-3 text-center">
        <div className="text-xs uppercase tracking-wide text-white/70">ASCII chart</div>
        <div className="mt-2 grid grid-cols-4 gap-1 text-sm font-display font-bold">
          <span>A=65</span>
          <span>H=72</span>
          <span>I=73</span>
          <span>S=83</span>
        </div>
        <p className="mt-2 text-3xl leading-none">{lastPrint ? lastPrint : "🔡"}</p>
        <p className="mt-1 text-xs text-white/70">Letters are numbers. input() is always text.</p>
      </div>
      {waiting ? (
        <div className="grid grid-cols-3 gap-2">
          {chips.map((chip) => (
            <button
              key={chip.word}
              type="button"
              onClick={() => onPick(chip.word)}
              className="press rounded-2xl bg-white px-2 py-2 text-slate-900 shadow"
            >
              <span className="block text-2xl leading-none">{chip.emoji}</span>
              <span className="mt-1 block font-display text-xs font-bold">{chip.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RpsBoard({ session, onPick }: { session: PySession | null; onPick: (word: string) => void }) {
  const waiting = session?.status === "waiting";
  const player = [...(session?.inputs ?? [])].reverse().map(rpsMove).find(Boolean);
  const computer = [...(session?.prints ?? [])].reverse().map(rpsMove).find(Boolean);
  const result = (session?.prints ?? []).find((line) => /you win|you lose|tie/i.test(line));
  return (
    <div className="mb-2 space-y-2">
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-sky-500/30 p-2">
          <div className="text-xs uppercase tracking-wide text-white/70">You</div>
          <div className="text-4xl leading-none">{player?.emoji ?? "❓"}</div>
          <div className="text-xs">{player?.label ?? "Pick"}</div>
        </div>
        <div className="rounded-2xl bg-white/10 p-2">
          <div className="text-xs uppercase tracking-wide text-white/70">Phone</div>
          <div className="text-4xl leading-none">{waiting ? "🤔" : computer?.emoji ?? "❓"}</div>
          <div className="text-xs">{waiting ? "Waiting" : computer?.label ?? "Hidden"}</div>
        </div>
      </div>
      {result ? <p className="rounded-2xl bg-amber-300 px-3 py-2 text-center font-display text-lg font-bold text-slate-900">{result}</p> : null}
      {waiting ? (
        <div className="grid grid-cols-3 gap-2">
          {RPS_MOVES.map((move) => (
            <button
              key={move.word}
              type="button"
              onClick={() => onPick(move.word)}
              className="press rounded-2xl bg-white px-2 py-2 text-slate-900 shadow"
            >
              <span className="block text-3xl leading-none">{move.emoji}</span>
              <span className="mt-1 block font-display text-xs font-bold">{move.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PythonPhone({
  title,
  session,
  playMode,
  overlay,
  onClearOverlay,
  onReply,
}: {
  title: string;
  session: PySession | null;
  playMode?: "rps" | "mad-libs" | "ascii";
  overlay: Overlay;
  onClearOverlay: () => void;
  onReply: (value: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const waiting = session?.status === "waiting";
  const send = () => {
    if (!session || !waiting || !draft.trim()) return;
    onReply(draft);
    setDraft("");
  };
  const pickMove = (word: string) => {
    if (!session || !waiting) return;
    onReply(word);
    setDraft("");
  };

  return (
    <MobileFrame>
      <div className="relative flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,#1e293b_0%,#0b1220_55%)] px-4 pb-4 pt-1 text-white">
        <h2 className="text-center font-display text-2xl font-bold">{title}</h2>
        <p className="mb-2 text-center text-xs text-white/70">
          {session?.game
            ? "The canvas plays your Python commands."
            : playMode === "rps"
              ? "Tap 🪨 📄 or ✂️ to play"
              : playMode === "mad-libs"
                ? "Tap a hero, object, or verb"
                : playMode === "ascii"
                  ? "Tap a letter code or a number"
                  : "print() and input() appear here"}
        </p>
        {session?.game ? <GameCanvas view={session.game} /> : null}
        {playMode === "rps" ? <RpsBoard session={session} onPick={pickMove} /> : null}
        {playMode === "mad-libs" ? <MadLibsBoard session={session} onPick={pickMove} /> : null}
        {playMode === "ascii" ? <AsciiBoard session={session} onPick={pickMove} /> : null}
        <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-white/10 p-3 text-sm shadow-inner backdrop-blur">
          {!session && <p className="text-white/70">Type Python on the left to start the app.</p>}
          {session?.prints.map((line, i) => (
            <div key={`p-${i}`} className="max-w-[90%] rounded-2xl bg-white px-3 py-2 text-slate-900 shadow">{playMode === "rps" ? rpsLine(line) : line}</div>
          ))}
          {session?.inputs.map((line, i) => (
            <div key={`i-${i}`} className="ml-auto max-w-[90%] rounded-2xl bg-sky-500 px-3 py-2 text-right text-white shadow">You: {playMode === "rps" ? rpsLine(line) : line}</div>
          ))}
          {waiting && session?.prompt ? (
            <div className="rounded-2xl bg-amber-300 px-3 py-2 font-display text-slate-900">{session.prompt}</div>
          ) : null}
          {session?.status === "done" && <p className="text-go font-display font-bold">Program finished.</p>}
          {session?.status === "error" && <p className="text-red-300">{session.error}</p>}
        </div>
        {waiting && (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => { e.preventDefault(); send(); }}
          >
            <input
              aria-label="Program input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-xl border border-white/20 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
              placeholder={playMode === "mad-libs" || playMode === "ascii" ? "Or type your own..." : "Type an answer..."}
            />
            <button className="press rounded-xl bg-sky-500 px-3 py-2 font-display font-bold text-white">Send</button>
          </form>
        )}
        {overlay && (
          <button
            className={`absolute inset-4 mt-6 rounded-2xl p-4 text-left font-display text-lg font-bold shadow-lg ${overlay.kind === "success" ? "bg-go text-code" : "bg-stop text-white"}`}
            onClick={onClearOverlay}
          >
            {overlay.kind === "success" ? "✅ " : "❌ "}
            {overlay.text}
            <div className="mt-2 text-sm font-normal opacity-80">Tap to close</div>
          </button>
        )}
      </div>
    </MobileFrame>
  );
}
