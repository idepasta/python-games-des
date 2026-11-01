export type Role = "student" | "admin";

export const CLASS_GROUPS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type ClassGroup = (typeof CLASS_GROUPS)[number];
export type ClassFilter = "all" | ClassGroup;

export function isClassGroup(value: string): value is ClassGroup {
  return (CLASS_GROUPS as readonly string[]).includes(value);
}

export function classFilterLabel(filter: ClassFilter): string {
  return filter === "all" ? "All Classes" : filter;
}

export type UserProgress = {
  hackerDone: string[];
  pythonDone: string[];
  ticTacToeComplete: boolean;
};

export type HistoryKind = "step_passed" | "error_made" | "game_completed" | "session_stopped" | "level_cleared";
export type ErrorType = "validation" | "syntax" | "logic";
export type PlayArea = "python" | "tic-tac-toe" | "hacker";

export type ScoreEvent = {
  id: string;
  at: string;
  kind: HistoryKind;
  area: PlayArea;
  missionId: string;
  missionTitle: string;
  stepId: string;
  stepTitle: string;
  points: number;
  message: string;
  codeSnippet: string;
  errorType: ErrorType | "";
  seconds: number;
};

export type LiveSession = {
  area: PlayArea;
  missionId: string;
  missionTitle: string;
  stepId: string;
  stepTitle: string;
  stepStartedAt: string;
  lastSeenAt: string;
  completed: boolean;
};

export function canonicalKind(kind: string): HistoryKind {
  if (kind === "game" || kind === "game_completed") return "game_completed";
  if (kind === "error_made" || kind === "session_stopped" || kind === "level_cleared") return kind;
  return "step_passed";
}

export type UserRecord = {
  id: string;
  username: string;
  role: Role;
  classGroup: ClassGroup | "";
  passwordHash: string;
  passwordSalt: string;
  reviveCodeHash: string;
  reviveCodeSalt: string;
  reviveAcknowledged: boolean;
  score: number;
  history: ScoreEvent[];
  liveSession: LiveSession | null;
  progress: UserProgress;
  createdAt: string;
};

export type SessionPayload = {
  userId: string;
  username: string;
  role: Role;
  reviveAcknowledged: boolean;
  exp: number;
};

export const emptyProgress = (): UserProgress => ({
  hackerDone: [],
  pythonDone: [],
  ticTacToeComplete: false,
});

export const PUBLIC_PATHS = ["/login", "/register", "/recover"] as const;
export const AUTH_COOKIE = "ctw_session";
export const USERS_KEY = "ctw_users";
export const PENDING_REVIVE_KEY = "ctw_pending_revive";
export const SESSION_DAYS = 30;
