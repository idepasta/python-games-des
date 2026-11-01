import { redirect } from "@tanstack/react-router";
import { ensureAdminAccount } from "@/lib/auth/seed-admin";
import { AUTH_COOKIE, PUBLIC_PATHS, type SessionPayload } from "@/lib/auth/types";
import { destination, findUser, parseSessionToken, readCookie } from "@/lib/auth/store";

export function isPublicPath(pathname: string): boolean {
  return (PUBLIC_PATHS as readonly string[]).includes(pathname);
}

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function cookieHeaderFromRequest(): string | null {
  if (typeof document !== "undefined") return document.cookie;
  return null;
}

export async function loadSession(): Promise<SessionPayload | null> {
  const token = readCookie(AUTH_COOKIE, cookieHeaderFromRequest());
  const session = await parseSessionToken(token);
  if (!session) return null;
  const user = findUser(session.username);
  if (!user || user.id !== session.userId) return null;
  return { ...session, role: user.role, reviveAcknowledged: user.reviveAcknowledged };
}

export async function enforceAuth(pathname: string): Promise<SessionPayload | null> {
  await ensureAdminAccount();
  const session = await loadSession();
  const publicPath = isPublicPath(pathname);

  if (!session && !publicPath) {
    throw redirect({ to: "/login", search: { redirect: pathname === "/" ? undefined : pathname } });
  }
  if (session && session.role !== "admin" && !session.reviveAcknowledged && pathname !== "/revive-code") {
    throw redirect({ to: "/revive-code" });
  }
  if (session && isAdminPath(pathname) && session.role !== "admin") {
    throw redirect({ to: "/" });
  }
  if (session && (publicPath || pathname === "/revive-code") && (session.role === "admin" || session.reviveAcknowledged)) {
    throw redirect({ to: destination(session) });
  }
  return session;
}
