import { useEffect, useRef, useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import { CodeEditor } from "@/components/code-editor";
import { PythonPhone } from "@/components/python-phone";
import { StepSwitcher } from "@/components/step-switcher";
import { hooksForGame } from "@/lib/canvas-games";
import { nextPythonCode, validatePythonStep, type PythonMission, type PythonStep } from "@/lib/python-missions";
import { pythonStepSolution } from "@/lib/python-solutions";
import { PySession } from "@/lib/python-vm";
import { awardScore, logError, logLevelCleared } from "@/lib/auth/scoring";
import { readProgress, writeProgress } from "@/lib/auth/store";
import { useStepTelemetry } from "@/hooks/use-step-telemetry";
import { showHintButton, showSolution } from "@/lib/hint-gate";
import { stepReachable } from "@/lib/mission-lock";

export function readDoneMissions(username?: string): string[] {
  if (!username) return [];
  return readProgress(username).pythonDone;
}

function writeDoneMissions(username: string, ids: string[]) {
  writeProgress(username, { ...readProgress(username), pythonDone: ids });
}

type Overlay = { kind: "success" | "fail"; text: string } | null;

function gameHooks(step: PythonStep | undefined) {
  if (!step?.game) return {};
  return hooksForGame(step.game.kind, step.game.level);
}

export function PythonStudio({ mission, onBack }: { mission: PythonMission; onBack: () => void }) {
  const { session: student } = useRouteContext({ from: "__root__" });
  const [step, setStep] = useState(0);
  const [codes, setCodes] = useState(() => mission.steps.map((item) => item.starterCode));
  const [checked, setChecked] = useState(false);
  const [hintOpen, setHintOpen] = useState(() => mission.steps.map(() => false));
  const [misses, setMisses] = useState(() => mission.steps.map(() => 0));
  const missesRef = useRef(misses);
  const [revealed, setRevealed] = useState(() => mission.steps.map(() => false));
  const [passed, setPassed] = useState(() => mission.steps.map(() => false));
  const [done, setDone] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [session, setSession] = useState(() => new PySession(mission.steps[0]!.starterCode, gameHooks(mission.steps[0])));
  const [, bump] = useState(0);
  const current = mission.steps[step]!;
  const code = codes[step] ?? current.starterCode;
  const stepMisses = misses[step] ?? 0;

  useEffect(() => { setSession(new PySession(code, gameHooks(current))); }, [code, current]);
  const result = validatePythonStep(current, code);
  const last = step >= mission.steps.length - 1;
  useStepTelemetry(student?.username, student?.role, {
    area: "python",
    missionId: mission.id,
    missionTitle: mission.title,
    stepId: current.id,
    stepTitle: current.title,
  });
  useEffect(() => {
    if (student?.role !== "student" || session.status !== "error" || !session.error || session.errorKind === "logic") return;
    logError(student.username, {
      area: "python",
      missionId: mission.id,
      missionTitle: mission.title,
      stepId: current.id,
      stepTitle: current.title,
      message: session.error,
      codeSnippet: code,
      errorType: "syntax",
    });
  }, [session, student?.role, student?.username, mission.id, mission.title, current.id, current.title, code]);
  useEffect(() => {
    if (student?.role !== "student" || !session.game || session.game.status === "playing") return;
    const place = {
      area: "python" as const,
      missionId: mission.id,
      missionTitle: mission.title,
      stepId: current.id,
      stepTitle: current.title,
    };
    if (session.game.status === "crash") {
      logError(student.username, {
        ...place,
        message: session.game.message || session.error || "The avatar crashed.",
        codeSnippet: code,
        errorType: "logic",
      });
    }
    if (session.game.status === "win") {
      logLevelCleared(student.username, place, session.game.message || "Level clear.", code);
    }
  }, [session, student?.role, student?.username, mission.id, mission.title, current.id, current.title, code]);

  const onCode = (value: string) => {
    setCodes((prev) => prev.map((item, i) => (i === step ? value : item)));
    setChecked(false);
    setOverlay(null);
  };

  const go = (index: number) => {
    if (!stepReachable(index, step, passed) || index === step) return;
    setCodes((prev) => {
      const next = prev.map((item, i) => (i === step ? code : item));
      const starter = mission.steps[index]?.starterCode;
      if (index === step + 1 && starter !== undefined && next[index] === starter) {
        next[index] = nextPythonCode(code, mission, index);
      }
      return next;
    });
    setStep(index);
    setChecked(false);
    setOverlay(null);
  };

  const check = () => {
    setChecked(true);
    if (result.ok) {
      setPassed((prev) => prev.map((flag, i) => (i === step ? true : flag)));
      setOverlay({ kind: "success", text: result.message });
      if (student?.role === "student" && !revealed[step]) {
        awardScore(student.username, {
          kind: "step_passed",
          area: "python",
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
    if (student?.role === "student") {
      logError(student.username, {
        area: "python",
        missionId: mission.id,
        missionTitle: mission.title,
        stepId: current.id,
        stepTitle: current.title,
        message: result.message,
        codeSnippet: code,
        errorType: "validation",
      });
    }
    if (showSolution(count)) {
      const answer = pythonStepSolution(mission.id, current.id);
      setCodes((prev) => prev.map((item, i) => (i === step ? answer : item)));
      setRevealed((prev) => prev.map((flag, i) => (i === step ? true : flag)));
      setPassed((prev) => prev.map((flag, i) => (i === step ? true : flag)));
      setOverlay({ kind: "success", text: "Here is the whole solution for this step." });
      return;
    }
    setOverlay({ kind: "fail", text: result.message });
  };

  const finish = () => {
    if (!result.ok) return;
    if (student?.role === "student") {
      const ids = readDoneMissions(student.username);
      if (!ids.includes(mission.id)) writeDoneMissions(student.username, [...ids, mission.id]);
      if (!revealed[step]) {
        awardScore(student.username, {
          kind: "game_completed",
          area: "python",
          missionId: mission.id,
          missionTitle: mission.title,
          stepId: "complete",
          stepTitle: "Game finished",
        });
      }
    }
    setDone(true);
    setOverlay({ kind: "success", text: `Mission complete! ${mission.title} is ready to play.` });
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
            <button onClick={check} className="press rounded-lg bg-go px-4 py-2 font-display font-bold text-code">Check Step</button>
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
        <section className="chunky mb-4 whitespace-pre-line rounded-2xl bg-card p-4 leading-6">
          <div className="mb-2 font-display text-sm font-bold">How to play</div>
          {mission.story}
        </section>
        <StepSwitcher titles={mission.steps.map((item) => item.title)} index={step} passed={passed} onGo={go} />
        <section className="chunky mb-4 rounded-2xl bg-card p-4">
          <div className="font-display text-sm text-muted-foreground">Step {step + 1} / {mission.steps.length}: {current.title}</div>
          <p className="mt-1 text-lg">{current.prompt}</p>
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
        </section>

        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <section className="flex min-h-[560px] flex-col">
            <div className="mb-2 font-display font-bold">Left: Python code</div>
            <div className="min-h-0 flex-1">
              <CodeEditor value={code} onChange={onCode} />
            </div>
          </section>
          <section className="flex min-h-[560px] flex-col">
            <div className="mb-2 font-display font-bold">Right: live phone preview</div>
            <div className="min-h-0 flex-1">
              <PythonPhone
                title={mission.title}
                session={session}
                playMode={mission.id === "rps" ? "rps" : mission.id === "mad-libs" ? "mad-libs" : mission.id === "ascii-decoder" ? "ascii" : undefined}
                overlay={overlay}
                onClearOverlay={() => setOverlay(null)}
                onReply={(value) => { session.provideInput(value); bump((n) => n + 1); }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
