import { useEffect, useMemo, useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import { CodeEditor } from "@/components/code-editor";
import { MobileFrame } from "@/components/mobile-frame";
import { PythonStudio, readDoneMissions } from "@/components/python-studio";
import { awardScore, logError } from "@/lib/auth/scoring";
import { readProgress, writeProgress } from "@/lib/auth/store";
import { useStepTelemetry } from "@/hooks/use-step-telemetry";
import {
  checkStep,
  checkWinner,
  codeWithNextStep,
  parseProgram,
  starterCode,
  ticTacToeMission,
  type CellMark,
  type MissionProgram,
  type PlayerTurn,
} from "@/lib/coding-mission";
import { pythonMissions } from "@/lib/python-missions";

export function CodingStudio() {
  const { session } = useRouteContext({ from: "__root__" });
  const [active, setActive] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { setDone(readDoneMissions(session?.username)); }, [active, session?.username]);

  if (active === "tic-tac-toe") return <TicTacToeStudio onBack={() => setActive(null)} />;
  const python = pythonMissions.find((mission) => mission.id === active);
  if (python) return <PythonStudio key={python.id} mission={python} onBack={() => setActive(null)} />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">Try it yourself</p>
      <h1 className="font-display text-4xl font-bold">Phone Game Studio</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Split-screen missions: type on the left and watch a live phone on the right. Start with Tic-Tac-Toe, then build Python mini-games, a miner, and a platformer.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button onClick={() => setActive("tic-tac-toe")} className="chunky rounded-2xl bg-card p-5 text-left hover:bg-secondary">
          <div className="text-4xl">{ticTacToeMission.emoji}</div>
          <div className="mt-2 font-display text-2xl font-bold">{ticTacToeMission.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">Live board preview with step-by-step settings.</p>
        </button>
        {pythonMissions.map((mission, index) => {
          const locked = index > 0 && !done.includes(pythonMissions[index - 1]!.id);
          const complete = done.includes(mission.id);
          return (
            <button
              key={mission.id}
              disabled={locked}
              onClick={() => setActive(mission.id)}
              className="chunky rounded-2xl bg-card p-5 text-left hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <div className="text-4xl">{locked ? "🔒" : mission.emoji} {complete ? "✅" : ""}</div>
              <div className="mt-2 font-display text-2xl font-bold">{mission.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">Mission {index + 1} of {pythonMissions.length} · {mission.teaser}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TicTacToeStudio({ onBack }: { onBack: () => void }) {
  const { session } = useRouteContext({ from: "__root__" });
  const mission = ticTacToeMission;
  const [step, setStep] = useState(0);
  const [code, setCode] = useState(() => starterCode(mission, 0));
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const [done, setDone] = useState(false);

  const parsed = useMemo(() => parseProgram(code), [code]);
  const result = checkStep(mission, step, code);
  const current = mission.steps[step]!;
  const last = step >= mission.steps.length - 1;
  useStepTelemetry(session?.username, session?.role, {
    area: "tic-tac-toe",
    missionId: mission.id,
    missionTitle: mission.title,
    stepId: current.id,
    stepTitle: current.title,
  });

  const onCode = (value: string) => {
    setCode(value);
    setChecked(false);
  };

  const next = () => {
    if (!result.ok) return;
    if (session?.role === "student") {
      awardScore(session.username, {
        kind: "step_passed",
        area: "tic-tac-toe",
        missionId: mission.id,
        missionTitle: mission.title,
        stepId: current.id,
        stepTitle: current.title,
      });
      if (last) {
        writeProgress(session.username, { ...readProgress(session.username), ticTacToeComplete: true });
        awardScore(session.username, {
          kind: "game_completed",
          area: "tic-tac-toe",
          missionId: mission.id,
          missionTitle: mission.title,
          stepId: "complete",
          stepTitle: "Game finished",
        });
      }
    }
    if (last) {
      setDone(true);
      return;
    }
    const nextIndex = step + 1;
    setCode(codeWithNextStep(code, mission, nextIndex));
    setStep(nextIndex);
    setChecked(false);
    setHint(false);
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="border-b-[3px] border-foreground bg-[#4d4d4d] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <button onClick={onBack} className="text-xs uppercase tracking-wide text-white/70 hover:text-white">← All missions</button>
            <h1 className="font-display text-2xl font-bold">{mission.emoji} {mission.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => {
              setChecked(true);
              if (session?.role === "student" && !result.ok) {
                logError(session.username, {
                  area: "tic-tac-toe",
                  missionId: mission.id,
                  missionTitle: mission.title,
                  stepId: current.id,
                  stepTitle: current.title,
                  message: result.message,
                  codeSnippet: code,
                  errorType: parsed.errors.length ? "syntax" : "validation",
                });
              }
            }} className="press rounded-lg bg-go px-4 py-2 font-display font-bold text-code">
              Check Step
            </button>
            <button
              disabled={!result.ok || (!checked && !done)}
              onClick={next}
              className="press rounded-lg bg-accent px-4 py-2 font-display font-bold text-accent-foreground disabled:opacity-40"
            >
              {last ? "Finish Mission" : "Next Step"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-4">
        <p className="mb-4 text-muted-foreground">{mission.story}</p>
        <div className="mb-3 flex gap-1" aria-label="Mission progress">
          {mission.steps.map((s, i) => (
            <div key={s.id} className={`h-2 flex-1 rounded ${i < step || done ? "bg-go" : i === step ? "bg-warn" : "bg-off/40"}`} />
          ))}
        </div>
        <section className="chunky mb-4 rounded-2xl bg-card p-4">
          <div className="font-display text-sm text-muted-foreground">Step {step + 1} / {mission.steps.length}: {current.title}</div>
          <p className="mt-1 text-lg">{current.instruction}</p>
          <button onClick={() => setHint(true)} className="mt-2 text-sm font-display font-bold text-primary">Need a hint?</button>
          {hint && <p className="mt-2 rounded-lg bg-warn/30 p-3">💡 {current.hint}</p>}
          {checked && (
            <p className={`mt-2 font-display font-bold ${result.ok ? "text-go" : "text-stop"}`}>
              {result.ok ? `✅ ${result.message}` : `❌ ${result.message}`}
            </p>
          )}
          {done && <p className="mt-2 font-display text-xl font-bold text-go">🏆 You built Tic-Tac-Toe. Play it on the phone!</p>}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="min-h-[520px]">
            <div className="mb-2 font-display font-bold">Left: code</div>
            <CodeEditor value={code} onChange={onCode} />
            {parsed.errors.length > 0 && (
              <p className="mt-2 text-sm text-stop">{parsed.errors[0]}</p>
            )}
          </section>
          <section>
            <div className="mb-2 font-display font-bold">Right: live phone preview</div>
            <MobileFrame>
              <TicTacToeApp program={parsed.program} />
            </MobileFrame>
          </section>
        </div>
      </div>
    </div>
  );
}

function TicTacToeApp({ program }: { program: MissionProgram }) {
  const size = program.gridSize && program.gridSize > 0 ? Math.min(6, program.gridSize) : 0;
  const xMark = program.xMark?.trim() || "X";
  const oMark = program.oMark?.trim() || "O";
  const [cells, setCells] = useState<CellMark[]>([]);
  const [turn, setTurn] = useState<PlayerTurn>("x");
  const boardKey = `${size}:${xMark}:${oMark}`;

  useEffect(() => {
    setCells(Array.from({ length: size * size }, () => null));
    setTurn("x");
  }, [boardKey, size]);

  const winner = program.checkWinner ? checkWinner(cells, size) : null;
  const status = !program.title
    ? "Type a title in the editor."
    : size < 1
      ? "Set grid_size to see the board."
      : winner === "draw"
        ? "It is a draw!"
        : winner
          ? `${winner} wins!`
          : program.turnsOn
            ? `${turn === "x" ? xMark : oMark}'s turn`
            : "Turn tapping is off.";

  const tap = (index: number) => {
    if (!program.turnsOn || winner || cells[index]) return;
    const mark = turn === "x" ? xMark : oMark;
    setCells((current) => current.map((cell, i) => (i === index ? mark : cell)));
    setTurn((current) => (current === "x" ? "o" : "x"));
  };

  const reset = () => {
    setCells(Array.from({ length: size * size }, () => null));
    setTurn("x");
  };

  return (
    <div key={boardKey} className="flex min-h-[500px] flex-col bg-gradient-to-b from-cool/30 to-card p-5 pt-10">
      <h2 className="text-center font-display text-2xl font-bold">{program.title || "Untitled App"}</h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">{status}</p>
      {size > 0 ? (
        <div
          className="mx-auto mt-6 grid w-full max-w-[220px] gap-1.5"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {cells.map((cell, i) => (
            <button
              key={`${boardKey}-${i}`}
              aria-label={`Square ${i + 1}`}
              onClick={() => tap(i)}
              disabled={!program.turnsOn}
              className="aspect-square rounded-lg border-2 border-foreground/20 bg-white text-2xl font-display font-bold disabled:cursor-default"
            >
              {cell ?? ""}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-10 text-center text-6xl">📱</div>
      )}
      {program.resetButton && size > 0 && (
        <button onClick={reset} className="press mx-auto mt-6 rounded-xl bg-primary px-4 py-2 font-display font-bold text-primary-foreground">
          New Game
        </button>
      )}
    </div>
  );
}
