import { useState } from "react";
import { GameCanvas } from "@/components/game-canvas";
import { MobileFrame } from "@/components/mobile-frame";
import type { PySession } from "@/lib/python-vm";

type Overlay = { kind: "success" | "fail"; text: string } | null;

export function PythonPhone({
  title,
  session,
  overlay,
  onClearOverlay,
  onReply,
}: {
  title: string;
  session: PySession | null;
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

  return (
    <MobileFrame>
      <div className="relative flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,#1e293b_0%,#0b1220_55%)] px-4 pb-4 pt-1 text-white">
        <h2 className="text-center font-display text-2xl font-bold">{title}</h2>
        <p className="mb-2 text-center text-xs text-white/70">
          {session?.game ? "The canvas plays your Python commands." : "print() and input() appear here"}
        </p>
        {session?.game ? <GameCanvas view={session.game} /> : null}
        <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-white/10 p-3 text-sm shadow-inner backdrop-blur">
          {!session && <p className="text-white/70">Type Python on the left to start the app.</p>}
          {session?.prints.map((line, i) => (
            <div key={`p-${i}`} className="max-w-[90%] rounded-2xl bg-white px-3 py-2 text-slate-900 shadow">{line}</div>
          ))}
          {session?.inputs.map((line, i) => (
            <div key={`i-${i}`} className="ml-auto max-w-[90%] rounded-2xl bg-sky-500 px-3 py-2 text-right text-white shadow">You: {line}</div>
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
              placeholder="Type an answer..."
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
