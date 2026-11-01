import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field } from "@/components/auth/auth-shell";
import { ensureAdminAccount } from "@/lib/auth/seed-admin";
import { destination, loginStudent } from "@/lib/auth/store";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Log in — Code the World" },
      { name: "description", content: "Students must log in with a username and password to play." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect: next } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    await ensureAdminAccount();
    const result = await loginStudent(username, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await router.invalidate();
    await navigate({ to: destination(result.user, next) });
  };

  return (
    <AuthShell
      title="Log in"
      footer={
        <>
          <Link to="/register" className="font-display font-bold text-primary">Create a student account</Link>
          <span className="mx-2">·</span>
          <Link to="/recover" className="font-display font-bold text-primary">Forgot password?</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Field label="Username" value={username} onChange={setUsername} autoComplete="username" />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <p className="text-stop font-display font-bold">{error}</p>}
        <button disabled={busy} className="press w-full rounded-xl bg-primary py-3 font-display text-xl font-bold text-primary-foreground disabled:opacity-50">
          {busy ? "Checking..." : "Enter"}
        </button>
      </form>
    </AuthShell>
  );
}
