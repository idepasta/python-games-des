import { hashSecret, secretsMatch, signPayload, verifySignedPayload } from "@/lib/auth/crypto";
import { requestCookieHeader } from "@/lib/auth/request-cookie";
import { generateReviveCode, normalizeReviveCode } from "@/lib/auth/revive-code";
import {
  AUTH_COOKIE,
  emptyProgress,
  PENDING_REVIVE_KEY,
  SESSION_DAYS,
  USERS_KEY,
  canonicalKind,
  isClassGroup,
  type ClassGroup,
  type Role,
  type ScoreEvent,
  type SessionPayload,
  type UserProgress,
  type UserRecord,
} from "@/lib/auth/types";

export type AuthResult = { ok: true; user: PublicUser; reviveCode?: string } | { ok: false; message: string };
export type PublicUser = {
  id: string;
  username: string;
  role: Role;
  classGroup: ClassGroup | "";
  score: number;
  reviveAcknowledged: boolean;
  progress: UserProgress;
};

export const USERNAME_RE = /^[a-zA-Z]+-[a-zA-Z]+$/;
export const USERNAME_HINT = "Please use only English letters and format it like: firstname-lastname";

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): string | null {
  if (!USERNAME_RE.test(value.trim())) return USERNAME_HINT;
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length < 4) return "Passwords need at least 4 characters.";
  if (value.length > 64) return "That password is too long.";
  return null;
}

export function validateClassGroup(value: string): string | null {
  if (!isClassGroup(value)) return "Choose a class: A1, A2, B1, B2, C1, or C2.";
  return null;
}

function canUseStorage(): boolean {
  return typeof localStorage !== "undefined";
}

function normalizeHistoryEvent(raw: Partial<ScoreEvent> & { kind?: string }): ScoreEvent {
  return {
    id: raw.id ?? crypto.randomUUID(),
    at: raw.at ?? new Date().toISOString(),
    kind: canonicalKind(raw.kind ?? "step_passed"),
    area: raw.area === "tic-tac-toe" || raw.area === "hacker" ? raw.area : "python",
    missionId: raw.missionId ?? "",
    missionTitle: raw.missionTitle ?? "",
    stepId: raw.stepId ?? "",
    stepTitle: raw.stepTitle ?? "",
    points: typeof raw.points === "number" ? raw.points : 0,
    message: raw.message ?? "",
    codeSnippet: raw.codeSnippet ?? "",
    errorType: raw.errorType === "syntax" || raw.errorType === "logic" || raw.errorType === "validation" ? raw.errorType : "",
    seconds: typeof raw.seconds === "number" ? raw.seconds : 0,
  };
}

function hydrateUser(raw: Partial<UserRecord>): UserRecord {
  return {
    id: raw.id ?? crypto.randomUUID(),
    username: raw.username ?? "",
    role: raw.role === "admin" ? "admin" : "student",
    classGroup: raw.classGroup && isClassGroup(raw.classGroup) ? raw.classGroup : "",
    passwordHash: raw.passwordHash ?? "",
    passwordSalt: raw.passwordSalt ?? "",
    reviveCodeHash: raw.reviveCodeHash ?? "",
    reviveCodeSalt: raw.reviveCodeSalt ?? "",
    reviveAcknowledged: Boolean(raw.reviveAcknowledged),
    score: typeof raw.score === "number" ? raw.score : 0,
    history: Array.isArray(raw.history) ? raw.history.map(normalizeHistoryEvent) : [],
    liveSession: raw.liveSession?.missionId ? raw.liveSession : null,
    progress: raw.progress ?? emptyProgress(),
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

function loadUsers(): UserRecord[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) as Partial<UserRecord>[] : [];
    return parsed.map(hydrateUser);
  } catch {
    return [];
  }
}

function saveUsers(users: UserRecord[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function saveUserRecord(user: UserRecord) {
  const key = normalizeUsername(user.username);
  const users = loadUsers().filter((item) => normalizeUsername(item.username) !== key);
  saveUsers([...users, user]);
}

export function listStudents(): UserRecord[] {
  return loadUsers()
    .filter((user) => user.role === "student")
    .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));
}

function toPublic(user: UserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    classGroup: user.classGroup,
    score: user.score,
    reviveAcknowledged: user.reviveAcknowledged,
    progress: user.progress,
  };
}

export function findUser(username: string): UserRecord | undefined {
  const key = normalizeUsername(username);
  return loadUsers().find((user) => normalizeUsername(user.username) === key);
}

export function updateUser(userId: string, patch: Partial<UserRecord>) {
  const users = loadUsers().map((user) => (user.id === userId ? { ...user, ...patch } : user));
  saveUsers(users);
}

export function readProgress(username: string): UserProgress {
  return findUser(username)?.progress ?? emptyProgress();
}

export function writeProgress(username: string, progress: UserProgress) {
  const user = findUser(username);
  if (!user) return;
  updateUser(user.id, { progress });
}

function cookieHeader(): string | null {
  if (typeof document !== "undefined") return document.cookie;
  return requestCookieHeader();
}

export function readCookie(name: string, header = cookieHeader()): string | null {
  if (!header) return null;
  const parts = header.split(";");
  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function writeCookie(token: string) {
  if (typeof document === "undefined") return;
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
}

export async function createSessionToken(user: UserRecord): Promise<string> {
  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    reviveAcknowledged: user.reviveAcknowledged,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  return signPayload(btoa(JSON.stringify(payload)));
}

export async function parseSessionToken(token: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const payload = await verifySignedPayload(token);
  if (!payload) return null;
  try {
    const session = JSON.parse(atob(payload)) as SessionPayload;
    if (!session.username || !session.userId || session.exp < Date.now()) return null;
    if (session.role !== "admin") session.role = "student";
    return session;
  } catch {
    return null;
  }
}

export async function readSessionFromCookie(header?: string | null): Promise<SessionPayload | null> {
  return parseSessionToken(readCookie(AUTH_COOKIE, header ?? cookieHeader()));
}

export async function setSession(user: UserRecord) {
  writeCookie(await createSessionToken(user));
}

export function clearSession() {
  clearCookie();
  if (canUseStorage()) localStorage.removeItem(PENDING_REVIVE_KEY);
}

export function setPendingReviveCode(username: string, code: string) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(PENDING_REVIVE_KEY, JSON.stringify({ username, code }));
}

export function getPendingReviveCode(): { username: string; code: string } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_REVIVE_KEY);
    return raw ? JSON.parse(raw) as { username: string; code: string } : null;
  } catch {
    return null;
  }
}

export function clearPendingReviveCode() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PENDING_REVIVE_KEY);
}

export async function registerStudent(usernameInput: string, password: string, classGroupInput: string): Promise<AuthResult> {
  const usernameError = validateUsername(usernameInput);
  if (usernameError) return { ok: false, message: usernameError };
  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false, message: passwordError };
  const classError = validateClassGroup(classGroupInput);
  if (classError) return { ok: false, message: classError };
  const classGroup = classGroupInput as ClassGroup;
  const username = usernameInput.trim();
  if (normalizeUsername(username) === "admin") return { ok: false, message: "That username is reserved for the tutor." };
  if (findUser(username)) return { ok: false, message: "That username is already taken. Try another." };

  const passwordSecret = await hashSecret(password);
  const reviveCode = generateReviveCode();
  const reviveSecret = await hashSecret(normalizeReviveCode(reviveCode));
  const user: UserRecord = {
    id: crypto.randomUUID(),
    username,
    role: "student",
    classGroup,
    passwordHash: passwordSecret.hash,
    passwordSalt: passwordSecret.salt,
    reviveCodeHash: reviveSecret.hash,
    reviveCodeSalt: reviveSecret.salt,
    reviveAcknowledged: false,
    score: 0,
    history: [],
    liveSession: null,
    progress: emptyProgress(),
    createdAt: new Date().toISOString(),
  };
  saveUsers([...loadUsers(), user]);
  setPendingReviveCode(username, reviveCode);
  await setSession(user);
  return { ok: true, user: toPublic(user), reviveCode };
}

export async function loginStudent(usernameInput: string, password: string): Promise<AuthResult> {
  const username = normalizeUsername(usernameInput);
  const user = findUser(username);
  if (!user || !(await secretsMatch(password, user.passwordHash, user.passwordSalt))) {
    return { ok: false, message: "Username or password is not right." };
  }
  await setSession(user);
  return { ok: true, user: toPublic(user) };
}

export async function recoverPassword(usernameInput: string, reviveCode: string, nextPassword: string): Promise<AuthResult> {
  const passwordError = validatePassword(nextPassword);
  if (passwordError) return { ok: false, message: passwordError };
  const user = findUser(usernameInput);
  const code = normalizeReviveCode(reviveCode);
  if (!user || !(await secretsMatch(code, user.reviveCodeHash, user.reviveCodeSalt))) {
    return { ok: false, message: "Username or Revive Code is not right." };
  }
  const passwordSecret = await hashSecret(nextPassword);
  updateUser(user.id, { passwordHash: passwordSecret.hash, passwordSalt: passwordSecret.salt });
  const fresh = findUser(user.username)!;
  await setSession(fresh);
  return { ok: true, user: toPublic(fresh) };
}

export async function acknowledgeReviveCode(username: string): Promise<void> {
  const user = findUser(username);
  if (!user) return;
  updateUser(user.id, { reviveAcknowledged: true });
  clearPendingReviveCode();
  const fresh = findUser(username);
  if (fresh) await setSession(fresh);
}

export function safeRedirect(path?: string): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/recover") || path.startsWith("/admin")) {
    return "/";
  }
  return path;
}

export function destination(user: Pick<PublicUser, "role" | "reviveAcknowledged">, requested?: string): "/admin" | "/revive-code" | "/" | string {
  if (user.role === "admin") return "/admin";
  if (!user.reviveAcknowledged) return "/revive-code";
  return safeRedirect(requested);
}
