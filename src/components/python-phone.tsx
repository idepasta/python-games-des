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
      <div className="relative flex min-h-[500px] flex-col bg-gradient-to-b from-cool/30 to-card p-4 pt-10">
        <h2 className="text-center font-display text-xl font-bold">{title}</h2>
        <p className="mb-3 text-center text-xs text-muted-foreground">
          {session?.game ? "The canvas plays your Python commands." : "print() and input() appear here"}
        </p>
        {session?.game ? <GameCanvas view={session.game} /> : null}
        <div className="flex-1 space-y-2 overflow-y-auto rounded-xl bg-white/70 p-3 text-sm">
          {!session && <p className="text-muted-foreground">Type Python on the left to start the app.</p>}
          {session?.prints.map((line, i) => (
            <div key={`p-${i}`} className="rounded-2xl bg-primary/10 px-3 py-2">{line}</div>
          ))}
          {session?.inputs.map((line, i) => (
            <div key={`i-${i}`} className="ml-6 rounded-2xl bg-secondary px-3 py-2 text-right">You: {line}</div>
          ))}
          {waiting && session?.prompt ? (
            <div className="rounded-2xl bg-warn/40 px-3 py-2 font-display">{session.prompt}</div>
          ) : null}
          {session?.status === "done" && <p className="text-go font-display font-bold">Program finished.</p>}
          {session?.status === "error" && <p className="text-stop">{session.error}</p>}
        </div>
        {waiting && (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => { e.preventDefault(); send(); }}
          >
            <input
              aria-label="Program input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="flex-1 rounded-xl border-2 border-foreground/20 px-3 py-2 text-sm outline-none"
              placeholder="Type an answer..."
            />
            <button className="press rounded-xl bg-primary px-3 py-2 font-display font-bold text-primary-foreground">Send</button>
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
