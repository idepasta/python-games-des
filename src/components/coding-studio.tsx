import { useEffect, useMemo, useRef, useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import { CodeEditor } from "@/components/code-editor";
import { MobileFrame } from "@/components/mobile-frame";
import { PythonStudio, readDoneMissions } from "@/components/python-studio";
import { StepSwitcher } from "@/components/step-switcher";
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
  ticTacToeSolution,
  type CellMark,
  type MissionProgram,
  type PlayerTurn,
} from "@/lib/coding-mission";
import { showHintButton, showSolution } from "@/lib/hint-gate";
import { phoneGameLocked, stepReachable } from "@/lib/mission-lock";
import { pythonMissions } from "@/lib/python-missions";

export function CodingStudio() {
  const { session } = useRouteContext({ from: "__root__" });
  const tutor = session?.role === "admin";
  const [active, setActive] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [ticDone, setTicDone] = useState(false);
  useEffect(() => {
    setDone(readDoneMissions(session?.username));
    setTicDone(session?.username ? readProgress(session.username).ticTacToeComplete : false);
  }, [active, session?.username]);

  if (active === "tic-tac-toe") return <TicTacToeStudio onBack={() => setActive(null)} />;
  const python = pythonMissions.find((mission) => mission.id === active);
  if (python) return <PythonStudio key={python.id} mission={python} onBack={() => setActive(null)} />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">Try it yourself</p>
      <h1 className="font-display text-4xl font-bold">Phone Game Studio</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        {tutor
          ? "Tutor preview: every mission is open, including Checkers, Othello, Flappy Bird, Bowling, and Trap Quiz."
          : "Split-screen missions: type on the left and watch a live phone on the right. Start with Tic-Tac-Toe, then build Checkers, Othello, and a platformer."}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button onClick={() => setActive("tic-tac-toe")} className="chunky rounded-2xl bg-card p-5 text-left hover:bg-secondary">
          <div className="text-4xl">{ticTacToeMission.emoji}</div>
          <div className="mt-2 font-display text-2xl font-bold">{ticTacToeMission.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">Live board preview with step-by-step settings.</p>
        </button>
        {pythonMissions.map((mission, index) => {
          const locked = phoneGameLocked(session?.role, index, ticDone, done, pythonMissions.map((item) => item.id));
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
  const [codes, setCodes] = useState(() => mission.steps.map((_, index) => starterCode(mission, index)));
  const [checked, setChecked] = useState(false);
  const [hintOpen, setHintOpen] = useState(() => mission.steps.map(() => false));
  const [misses, setMisses] = useState(() => mission.steps.map(() => 0));
  const missesRef = useRef(misses);
  const [revealed, setRevealed] = useState(() => mission.steps.map(() => false));
  const [passed, setPassed] = useState(() => mission.steps.map(() => false));
  const [done, setDone] = useState(false);

  const code = codes[step] ?? starterCode(mission, step);
  const stepMisses = misses[step] ?? 0;
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
    setCodes((prev) => prev.map((item, i) => (i === step ? value : item)));
    setChecked(false);
  };

  const go = (index: number) => {
    if (!stepReachable(index, step, passed) || index === step) return;
    setCodes((prev) => {
      const next = prev.map((item, i) => (i === step ? code : item));
      const starter = starterCode(mission, index);
      if (index === step + 1 && next[index] === starter) next[index] = codeWithNextStep(code, mission, index);
      return next;
    });
    setStep(index);
    setChecked(false);
  };

  const finish = () => {
    if (!result.ok) return;
    if (session?.role === "student") {
      writeProgress(session.username, { ...readProgress(session.username), ticTacToeComplete: true });
      if (!revealed[step]) {
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
    setDone(true);
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="border-b-[3px] border-foreground bg-[#4d4d4d] text-white">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <button onClick={onBack} className="text-xs uppercase tracking-wide text-white/70 hover:text-white">← All missions</button>
            <h1 className="font-display text-2xl font-bold">{mission.emoji} {mission.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => {
              setChecked(true);
              if (result.ok) {
                setPassed((prev) => prev.map((flag, i) => (i === step ? true : flag)));
                if (session?.role === "student" && !revealed[step]) {
                  awardScore(session.username, {
                    kind: "step_passed",
                    area: "tic-tac-toe",
                    missionId: mission.id,
                    missionTitle: mission.title,
                    stepId: current.id,
                    stepTitle: current.title,
                  });
                }
                return;
              }
              const count = (missesRef.current[step] ?? 0) + 1;
              missesRef.current = missesRef.current.map((n, i) => (i === step ? count : n));
              setMisses(missesRef.current);
              if (session?.role === "student") {
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
              if (showSolution(count)) {
                const answer = ticTacToeSolution(step);
                setCodes((prev) => prev.map((item, i) => (i === step ? answer : item)));
                setRevealed((prev) => prev.map((flag, i) => (i === step ? true : flag)));
                setPassed((prev) => prev.map((flag, i) => (i === step ? true : flag)));
              }
            }} className="press rounded-lg bg-go px-4 py-2 font-display font-bold text-code">
              Check Step
            </button>
            {last && (
              <button
                disabled={!result.ok || (!checked && !revealed[step] && !done)}
                onClick={finish}
                className="press rounded-lg bg-accent px-4 py-2 font-display font-bold text-accent-foreground disabled:opacity-40"
              >
                Finish Mission
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1360px] px-4 py-4">
        <p className="mb-4 text-muted-foreground">{mission.story}</p>
        <StepSwitcher titles={mission.steps.map((item) => item.title)} index={step} passed={passed} onGo={go} />
        <section className="chunky mb-4 rounded-2xl bg-card p-4">
          <div className="font-display text-sm text-muted-foreground">Step {step + 1} / {mission.steps.length}: {current.title}</div>
          <p className="mt-1 text-lg">{current.instruction}</p>
          {showHintButton(stepMisses) && (
            <button onClick={() => setHintOpen((prev) => prev.map((flag, i) => (i === step ? true : flag)))} className="mt-2 text-sm font-display font-bold text-primary">Need a hint?</button>
          )}
          {hintOpen[step] && <p className="mt-2 rounded-lg bg-warn/30 p-3">💡 {current.hint}</p>}
          {revealed[step] && <p className="mt-2 rounded-lg bg-secondary p-3 font-display font-bold">Here is the whole solution for this step. It is in the editor.</p>}
          {checked && (
            <p className={`mt-2 font-display font-bold ${result.ok ? "text-go" : "text-stop"}`}>
              {result.ok ? `✅ ${result.message}` : `❌ ${result.message}`}
            </p>
          )}
          {done && <p className="mt-2 font-display text-xl font-bold text-go">🏆 You built Tic-Tac-Toe. Play it on the phone!</p>}
        </section>

        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <section className="flex min-h-[560px] flex-col">
            <div className="mb-2 font-display font-bold">Left: code</div>
            <div className="min-h-0 flex-1">
              <CodeEditor value={code} onChange={onCode} />
            </div>
            {parsed.errors.length > 0 && (
              <p className="mt-2 text-sm text-stop">{parsed.errors[0]}</p>
            )}
          </section>
          <section className="flex min-h-[560px] flex-col">
            <div className="mb-2 font-display font-bold">Right: live phone preview</div>
            <div className="min-h-0 flex-1">
              <MobileFrame>
                <TicTacToeApp program={parsed.program} />
              </MobileFrame>
            </div>
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
    <div key={boardKey} className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,#1e293b_0%,#0b1220_55%)] px-4 pb-4 pt-2 text-white">
      <h2 className="text-center font-display text-2xl font-bold">{program.title || "Untitled App"}</h2>
      <p className="mt-2 text-center text-sm text-white/70">{status}</p>
      {size > 0 ? (
        <div
          className="mx-auto mt-4 grid w-full max-w-[280px] gap-2"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {cells.map((cell, i) => (
            <button
              key={`${boardKey}-${i}`}
              aria-label={`Square ${i + 1}`}
              onClick={() => tap(i)}
              disabled={!program.turnsOn}
              className="aspect-square rounded-xl border border-white/15 bg-white text-2xl font-display font-bold text-slate-900 shadow disabled:cursor-default"
            >
              {cell ?? ""}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center text-5xl">📱</div>
      )}
      {program.resetButton && size > 0 && (
        <button onClick={reset} className="press mx-auto mt-4 rounded-xl bg-sky-500 px-4 py-2 font-display font-bold text-white">
          New Game
        </button>
      )}
    </div>
  );
}
