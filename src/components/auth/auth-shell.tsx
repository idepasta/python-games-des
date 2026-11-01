import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { USERNAME_HINT, validateUsername } from "@/lib/auth/store";
import { CLASS_GROUPS } from "@/lib/auth/types";

export function AuthShell({ title, children, footer }: { title: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-6xl">🐍🔐</div>
          <h1 className="mt-3 font-display text-4xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">Log in to play games and missions. Guests cannot enter.</p>
        </div>
        <div className="chunky rounded-3xl bg-card p-6 space-y-4">{children}</div>
        {footer && <div className="mt-4 text-center text-sm">{footer}</div>}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          No email. No phone number. Just a username, a password, and your secret Revive Code.
        </p>
        <div className="mt-3 text-center">
          <Link to="/login" className="text-sm font-display font-bold text-primary">Student door</Link>
        </div>
      </div>
    </div>
  );
}

export function UsernameField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const invalid = value.trim().length > 0 && validateUsername(value) !== null;
  return (
    <label className="block font-display font-bold" htmlFor="username">
      Username
      <input
        id="username"
        type="text"
        required
        value={value}
        autoComplete="username"
        spellCheck={false}
        aria-invalid={invalid}
        aria-describedby="username-hint"
        pattern="^[a-zA-Z]+-[a-zA-Z]+$"
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 w-full rounded-xl border-[3px] bg-background px-3 py-2 font-sans font-normal outline-none ${invalid ? "border-stop" : "border-foreground"}`}
      />
      <span id="username-hint" className={`mt-1 block text-sm font-sans font-normal ${invalid ? "font-bold text-stop" : "text-muted-foreground"}`}>
        {USERNAME_HINT}
      </span>
    </label>
  );
}

export function ClassField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block font-display font-bold" htmlFor="class-group">
      Class
      <select
        id="class-group"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border-[3px] border-foreground bg-background px-3 py-2 font-sans font-normal outline-none"
      >
        <option value="">Choose your class</option>
        {CLASS_GROUPS.map((group) => (
          <option key={group} value={group}>{group}</option>
        ))}
      </select>
    </label>
  );
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block font-display font-bold" htmlFor={id}>
      {label}
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border-[3px] border-foreground bg-background px-3 py-2 font-sans font-normal outline-none"
      />
    </label>
  );
}
