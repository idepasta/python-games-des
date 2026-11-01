import { useEffect, useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import { CodeEditor } from "@/components/code-editor";
import { PythonPhone } from "@/components/python-phone";
import { hooksForGame } from "@/lib/canvas-games";
import { nextPythonCode, validatePythonStep, type PythonMission, type PythonStep } from "@/lib/python-missions";
import { PySession } from "@/lib/python-vm";
import { awardScore, logError, logLevelCleared } from "@/lib/auth/scoring";
import { readProgress, writeProgress } from "@/lib/auth/store";
import { useStepTelemetry } from "@/hooks/use-step-telemetry";

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
  const [code, setCode] = useState(mission.steps[0]!.starterCode);
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState(false);
  const [done, setDone] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [session, setSession] = useState(() => new PySession(code, gameHooks(mission.steps[0])));
  const [, bump] = useState(0);
  const current = mission.steps[step]!;

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
    setCode(value);
    setChecked(false);
    setOverlay(null);
  };

  const check = () => {
    setChecked(true);
    setOverlay({ kind: result.ok ? "success" : "fail", text: result.message });
    if (student?.role === "student" && !result.ok) {
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
  };

  const next = () => {
    if (!result.ok) return;
    if (student?.role === "student") {
      awardScore(student.username, {
        kind: "step_passed",
        area: "python",
        missionId: mission.id,
        missionTitle: mission.title,
        stepId: current.id,
        stepTitle: current.title,
      });
      if (last) {
        const ids = readDoneMissions(student.username);
        if (!ids.includes(mission.id)) writeDoneMissions(student.username, [...ids, mission.id]);
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
    if (last) {
      setDone(true);
      setOverlay({ kind: "success", text: `Mission complete! ${mission.title} is ready to play.` });
      return;
    }
    const nextIndex = step + 1;
    setCode(nextPythonCode(code, mission, nextIndex));
    setStep(nextIndex);
    setChecked(false);
    setHint(false);
    setOverlay(null);
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
            <button onClick={check} className="press rounded-lg bg-go px-4 py-2 font-display font-bold text-code">Check Step</button>
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
          {mission.steps.map((item, i) => (
            <div key={item.id} className={`h-2 flex-1 rounded ${i < step || done ? "bg-go" : i === step ? "bg-warn" : "bg-off/40"}`} />
          ))}
        </div>
        <section className="chunky mb-4 rounded-2xl bg-card p-4">
          <div className="font-display text-sm text-muted-foreground">Step {step + 1} / {mission.steps.length}: {current.title}</div>
          <p className="mt-1 text-lg">{current.prompt}</p>
          <button onClick={() => setHint(true)} className="mt-2 text-sm font-display font-bold text-primary">Need a hint?</button>
          {hint && <p className="mt-2 rounded-lg bg-warn/30 p-3">💡 {current.hint}</p>}
          {checked && (
            <p className={`mt-2 font-display font-bold ${result.ok ? "text-go" : "text-stop"}`}>
              {result.ok ? `✅ ${result.message}` : `❌ ${result.message}`}
            </p>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="min-h-[520px]">
            <div className="mb-2 font-display font-bold">Left: Python code</div>
            <CodeEditor value={code} onChange={onCode} />
          </section>
          <section>
            <div className="mb-2 font-display font-bold">Right: live phone preview</div>
            <PythonPhone
              title={mission.title}
              session={session}
              overlay={overlay}
              onClearOverlay={() => setOverlay(null)}
              onReply={(value) => { session.provideInput(value); bump((n) => n + 1); }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
