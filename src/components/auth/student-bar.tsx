import { Link, useNavigate, useRouteContext, useRouter } from "@tanstack/react-router";
import { ScoreBadge } from "@/components/auth/score-badge";
import { clearSession } from "@/lib/auth/store";

export function StudentBar() {
  const { session } = useRouteContext({ from: "__root__" });
  const navigate = useNavigate();
  const router = useRouter();
  if (!session) return null;

  const logout = async () => {
    clearSession();
    await router.invalidate();
    await navigate({ to: "/login" });
  };

  return (
    <div className="border-b-[3px] border-foreground bg-card px-4 py-2 pr-28">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <p className="font-display font-bold">Hi, {session.username}!</p>
        <div className="flex items-center gap-2">
          {session.role === "admin" && (
            <Link to="/admin" className="press rounded-lg bg-primary px-3 py-1 font-display font-bold text-primary-foreground">
              Tutor desk
            </Link>
          )}
          <button onClick={logout} className="press rounded-lg bg-secondary px-3 py-1 font-display font-bold">
            Log out
          </button>
        </div>
      </div>
      {session.role === "student" && <ScoreBadge username={session.username} />}
    </div>
  );
}
