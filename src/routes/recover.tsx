import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, Field } from "@/components/auth/auth-shell";
import { recoverPassword } from "@/lib/auth/store";

export const Route = createFileRoute("/recover")({
  head: () => ({
    meta: [
      { title: "Revive account — Code the World" },
      { name: "description", content: "Reset a student password with a username and Revive Code." },
    ],
  }),
  component: RecoverPage,
});

function RecoverPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [revive, setRevive] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await recoverPassword(username, revive, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await router.invalidate();
    await navigate({ to: result.user.reviveAcknowledged ? "/" : "/revive-code" });
  };

  return (
    <AuthShell
      title="Revive account"
      footer={<Link to="/login" className="font-display font-bold text-primary">Back to log in</Link>}
    >
      <p>Type your username and the Revive Code you saved when you joined.</p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Username" value={username} onChange={setUsername} autoComplete="username" />
        <Field label="Revive Code" value={revive} onChange={setRevive} autoComplete="off" />
        <Field label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        {error && <p className="text-stop font-display font-bold">{error}</p>}
        <button disabled={busy} className="press w-full rounded-xl bg-primary py-3 font-display text-xl font-bold text-primary-foreground disabled:opacity-50">
          {busy ? "Checking..." : "Set new password"}
        </button>
      </form>
    </AuthShell>
  );
}
