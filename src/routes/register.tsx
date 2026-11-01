import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell, ClassField, Field, UsernameField } from "@/components/auth/auth-shell";
import { registerStudent, USERNAME_HINT, validateUsername } from "@/lib/auth/store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Code the World" },
      { name: "description", content: "Create a student account with a username, password, and class." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [classGroup, setClassGroup] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const usernameError = validateUsername(username);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords must match.");
      return;
    }
    if (!classGroup) {
      setError("Choose a class: A1, A2, B1, B2, C1, or C2.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await registerStudent(username, password, classGroup);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await router.invalidate();
    await navigate({ to: "/revive-code" });
  };

  return (
    <AuthShell
      title="Join the class"
      footer={<Link to="/login" className="font-display font-bold text-primary">I already have an account</Link>}
    >
      <form noValidate onSubmit={submit} className="space-y-3">
        <UsernameField
          value={username}
          onChange={(value) => {
            setUsername(value);
            if (error === USERNAME_HINT) setError("");
          }}
        />
        <ClassField value={classGroup} onChange={setClassGroup} />
        <Field label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        <Field label="Type password again" type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {error && <p className="text-stop font-display font-bold">{error}</p>}
        <button disabled={busy || Boolean(usernameError)} className="press w-full rounded-xl bg-accent py-3 font-display text-xl font-bold text-accent-foreground disabled:opacity-50">
          {busy ? "Saving..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
