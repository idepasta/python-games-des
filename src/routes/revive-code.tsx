import { createFileRoute, useNavigate, useRouteContext, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { acknowledgeReviveCode, getPendingReviveCode } from "@/lib/auth/store";

export const Route = createFileRoute("/revive-code")({
  head: () => ({
    meta: [
      { title: "Save your Revive Code — Code the World" },
      { name: "description", content: "Write down your Revive Code. It is shown only once." },
    ],
  }),
  component: ReviveCodePage,
});

function ReviveCodePage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { session } = useRouteContext({ from: "__root__" });
  const pending = getPendingReviveCode();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const username = pending?.username ?? session?.username;

  const continueOn = async () => {
    if (!saved || !username) return;
    setBusy(true);
    await acknowledgeReviveCode(username);
    await router.invalidate();
    setBusy(false);
    await navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-code px-4 py-10 text-code-foreground">
      <div className="w-full max-w-lg chunky rounded-3xl bg-card p-6 text-foreground">
        <div className="text-center text-5xl">🛟</div>
        <h1 className="mt-3 text-center font-display text-3xl font-bold">Save your Revive Code</h1>
        <p className="mt-3 text-center">
          This secret is shown only once. Write it on paper and keep it in a safe place. You need it if you forget your password.
        </p>
        {pending?.code ? (
          <div className="my-6 rounded-2xl border-[3px] border-foreground bg-warn/40 p-4 text-center">
            <div className="text-sm font-display">Your Revive Code</div>
            <p className="mt-2 break-all font-mono text-2xl font-bold tracking-wide">{pending.code}</p>
          </div>
        ) : (
          <p className="my-6 rounded-2xl bg-muted p-4 text-center">
            The Revive Code was already shown on this device. If you did not write it down, ask a grown-up for help.
          </p>
        )}
        <label className="flex items-start gap-2 font-display font-bold">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-1 size-5" />
          I wrote down my Revive Code and will not lose it.
        </label>
        <button
          disabled={!saved || busy || !username}
          onClick={continueOn}
          className="press mt-4 w-full rounded-xl bg-go py-3 font-display text-xl font-bold text-code disabled:opacity-40"
        >
          {busy ? "Opening the games..." : "I saved it. Continue"}
        </button>
      </div>
    </div>
  );
}
