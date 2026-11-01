import { findUser, updateUser } from "@/lib/auth/store";
import { canonicalKind, type ErrorType, type HistoryKind, type LiveSession, type PlayArea, type ScoreEvent, type UserProgress } from "@/lib/auth/types";
import { missions } from "@/lib/missions";
import { pythonMissions } from "@/lib/python-missions";
import { ticTacToeMission } from "@/lib/coding-mission";

export const STEP_POINTS = 10;
export const GAME_POINTS = 50;
export const SCORE_EVENT = "ctw-score";

export const TOTAL_GAMES = pythonMissions.length + missions.length + 1;
export const TOTAL_STEPS =
  pythonMissions.reduce((sum, mission) => sum + mission.steps.length, 0)
  + missions.reduce((sum, mission) => sum + mission.steps.length, 0)
  + ticTacToeMission.steps.length;

export function eventKey(event: Pick<ScoreEvent, "kind" | "area" | "missionId" | "stepId">): string {
  return `${canonicalKind(event.kind)}:${event.area}:${event.missionId}:${event.stepId}`;
}

export type PlayLocation = {
  area: PlayArea;
  missionId: string;
  missionTitle: string;
  stepId: string;
  stepTitle: string;
};

function secondsSince(start: string): number {
  const ms = Date.now() - Date.parse(start);
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.round(ms / 1000);
}

function blankEvent(partial: Omit<ScoreEvent, "id" | "at" | "points" | "message" | "codeSnippet" | "errorType" | "seconds"> & Partial<ScoreEvent>): ScoreEvent {
  return {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    points: 0,
    message: "",
    codeSnippet: "",
    errorType: "",
    seconds: 0,
    ...partial,
    kind: canonicalKind(partial.kind),
  };
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SCORE_EVENT));
}

export function gamesFinished(progress: UserProgress): number {
  return progress.pythonDone.length + progress.hackerDone.length + (progress.ticTacToeComplete ? 1 : 0);
}

export function completionPercent(progress: UserProgress): number {
  if (TOTAL_GAMES === 0) return 0;
  return Math.round((gamesFinished(progress) / TOTAL_GAMES) * 100);
}

export function awardScore(
  username: string,
  event: Omit<ScoreEvent, "id" | "at" | "points" | "message" | "codeSnippet" | "errorType" | "seconds"> & { kind: HistoryKind | "step" | "game"; points?: number; seconds?: number },
): { awarded: boolean; score: number } {
  const user = findUser(username);
  if (!user || user.role !== "student") return { awarded: false, score: user?.score ?? 0 };
  const kind = canonicalKind(event.kind);
  const points = event.points ?? (kind === "game_completed" ? GAME_POINTS : STEP_POINTS);
  let seconds = event.seconds ?? 0;
  let liveSession = user.liveSession;
  if (kind === "step_passed" && liveSession && liveSession.missionId === event.missionId && liveSession.stepId === event.stepId) {
    seconds = secondsSince(liveSession.stepStartedAt);
    liveSession = { ...liveSession, completed: true, lastSeenAt: new Date().toISOString() };
  }
  const next = blankEvent({ ...event, kind, points, seconds });
  if (user.history.some((item) => eventKey(item) === eventKey(next))) {
    return { awarded: false, score: user.score };
  }
  const score = user.score + points;
  updateUser(user.id, { score, history: [...user.history, next], liveSession });
  notify();
  return { awarded: true, score };
}

export function logError(
  username: string,
  event: PlayLocation & { message: string; codeSnippet: string; errorType: ErrorType },
): void {
  const user = findUser(username);
  if (!user || user.role !== "student" || !event.message.trim()) return;
  const snippet = event.codeSnippet.slice(0, 500);
  const previous = user.history[user.history.length - 1];
  if (previous?.kind === "error_made" && previous.stepId === event.stepId && previous.message === event.message && previous.codeSnippet === snippet) return;
  const next = blankEvent({
    kind: "error_made",
    area: event.area,
    missionId: event.missionId,
    missionTitle: event.missionTitle,
    stepId: event.stepId,
    stepTitle: event.stepTitle,
    message: event.message,
    codeSnippet: snippet,
    errorType: event.errorType,
  });
  updateUser(user.id, { history: [...user.history, next] });
  notify();
}

export function logLevelCleared(username: string, event: PlayLocation, message: string, codeSnippet: string): void {
  const user = findUser(username);
  if (!user || user.role !== "student") return;
  const snippet = codeSnippet.slice(0, 500);
  const previous = user.history[user.history.length - 1];
  if (previous?.kind === "level_cleared" && previous.missionId === event.missionId && previous.stepId === event.stepId && previous.codeSnippet === snippet) return;
  const next = blankEvent({
    kind: "level_cleared",
    area: event.area,
    missionId: event.missionId,
    missionTitle: event.missionTitle,
    stepId: event.stepId,
    stepTitle: event.stepTitle,
    message,
    codeSnippet: snippet,
    points: 0,
  });
  updateUser(user.id, { history: [...user.history, next] });
  notify();
}

export function beginStep(username: string, location: PlayLocation): void {
  const user = findUser(username);
  if (!user || user.role !== "student") return;
  const live = user.liveSession;
  const same = live && live.area === location.area && live.missionId === location.missionId && live.stepId === location.stepId;
  if (same && live) {
    updateUser(user.id, { liveSession: { ...live, lastSeenAt: new Date().toISOString(), missionTitle: location.missionTitle, stepTitle: location.stepTitle } });
    return;
  }
  const now = new Date().toISOString();
  const nextLive: LiveSession = { ...location, stepStartedAt: now, lastSeenAt: now, completed: false };
  if (live && !live.completed && secondsSince(live.stepStartedAt) >= 2) {
    const stopped = blankEvent({
      kind: "session_stopped",
      area: live.area,
      missionId: live.missionId,
      missionTitle: live.missionTitle,
      stepId: live.stepId,
      stepTitle: live.stepTitle,
      seconds: secondsSince(live.stepStartedAt),
      message: "Left this step before it was passed.",
    });
    updateUser(user.id, { history: [...user.history, stopped], liveSession: nextLive });
    notify();
    return;
  }
  updateUser(user.id, { liveSession: nextLive });
}

export function endStep(username: string): void {
  const user = findUser(username);
  const live = user?.liveSession;
  if (!user || !live) return;
  if (live.completed || secondsSince(live.stepStartedAt) < 2) {
    updateUser(user.id, { liveSession: null });
    return;
  }
  const stopped = blankEvent({
    kind: "session_stopped",
    area: live.area,
    missionId: live.missionId,
    missionTitle: live.missionTitle,
    stepId: live.stepId,
    stepTitle: live.stepTitle,
    seconds: secondsSince(live.stepStartedAt),
    message: "Left this step before it was passed.",
  });
  updateUser(user.id, { history: [...user.history, stopped], liveSession: null });
  notify();
}

export function errorRate(history: ScoreEvent[]): number {
  const errors = history.filter((item) => item.kind === "error_made").length;
  const passed = history.filter((item) => item.kind === "step_passed").length;
  const total = errors + passed;
  if (total === 0) return 0;
  return Math.round((errors / total) * 100);
}

export function studentStatus(user: { liveSession: LiveSession | null; history: ScoreEvent[] }): string {
  const live = user.liveSession;
  if (live) return `Playing ${live.missionTitle} — ${live.stepTitle}`;
  const stopped = [...user.history].reverse().find((item) => item.kind === "session_stopped");
  if (!stopped) return "Not currently in a game";
  const passedLater = user.history.some((item) => item.kind === "step_passed" && item.missionId === stopped.missionId && item.stepId === stopped.stepId && item.at >= stopped.at);
  if (passedLater) return "Not currently in a game";
  return `Stuck on ${stopped.missionTitle} — ${stopped.stepTitle}`;
}
