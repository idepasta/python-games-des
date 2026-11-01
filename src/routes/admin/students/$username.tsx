import { createFileRoute, Link } from "@tanstack/react-router";
import { completionPercent, errorRate, gamesFinished, studentStatus, TOTAL_GAMES } from "@/lib/auth/scoring";
import { findUser } from "@/lib/auth/store";
import type { HistoryKind } from "@/lib/auth/types";

export const Route = createFileRoute("/admin/students/$username")({
  head: () => ({
    meta: [
      { title: "Grade student — Code the World" },
      { name: "description", content: "Score, error log, and step timeline for one student." },
    ],
  }),
  component: StudentGradePage,
});

const KIND_LABEL: Record<HistoryKind, string> = {
  step_passed: "Step passed",
  error_made: "Error",
  game_completed: "Game finished",
  session_stopped: "Left step",
  level_cleared: "Level cleared",
};

function StudentGradePage() {
  const { username } = Route.useParams();
  const student = findUser(username);
  const history = [...(student?.history ?? [])].sort((a, b) => b.at.localeCompare(a.at));
  const errors = history.filter((event) => event.kind === "error_made");

  if (!student || student.role !== "student") {
    return (
      <main>
        <Link to="/admin/students" className="font-display font-bold text-primary">← Students</Link>
        <h1 className="mt-4 font-display text-3xl font-bold">Student not found</h1>
      </main>
    );
  }

  return (
    <main>
      <Link to="/admin/students" className="font-display font-bold text-primary">← Students</Link>
      <h1 className="mt-4 font-display text-4xl font-bold">{student.username}</h1>
      <p className="mt-1 text-muted-foreground">Class {student.classGroup || "unassigned"}</p>
      <p className="mt-2 rounded-xl bg-warn/40 px-4 py-3 font-display font-bold">{studentStatus(student)}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Total score" value={`⭐ ${student.score}`} />
        <Metric label="Games completed" value={`${gamesFinished(student.progress)} / ${TOTAL_GAMES} · ${completionPercent(student.progress)}%`} />
        <Metric label="Error rate" value={`${errorRate(student.history)}%`} />
      </div>

      <h2 className="mt-8 font-display text-2xl font-bold">Error log</h2>
      <div className="chunky mt-3 overflow-x-auto rounded-2xl bg-card">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-secondary font-display">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Mission</th>
              <th className="px-4 py-3">Step</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Code</th>
            </tr>
          </thead>
          <tbody>
            {errors.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">No wrong attempts logged yet.</td></tr>
            )}
            {errors.map((event) => (
              <tr key={event.id} className="border-t border-foreground/10 align-top">
                <td className="px-4 py-3">{new Date(event.at).toLocaleString("en-US")}</td>
                <td className="px-4 py-3">{event.errorType || "validation"}</td>
                <td className="px-4 py-3">{event.missionTitle}</td>
                <td className="px-4 py-3">{event.stepTitle}</td>
                <td className="px-4 py-3">{event.message}</td>
                <td className="px-4 py-3"><pre className="max-w-xs whitespace-pre-wrap font-mono text-xs">{event.codeSnippet || "—"}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-display text-2xl font-bold">Timeline</h2>
      <div className="chunky mt-3 overflow-x-auto rounded-2xl bg-card">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-secondary font-display">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Mission</th>
              <th className="px-4 py-3">Step</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Points</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">This student has no recorded actions yet.</td></tr>
            )}
            {history.map((event) => (
              <tr key={event.id} className="border-t border-foreground/10">
                <td className="px-4 py-3">{new Date(event.at).toLocaleString("en-US")}</td>
                <td className="px-4 py-3">{KIND_LABEL[event.kind]}</td>
                <td className="px-4 py-3">{event.missionTitle}</td>
                <td className="px-4 py-3">{event.stepTitle}</td>
                <td className="px-4 py-3">{event.seconds ? `${event.seconds}s` : "—"}</td>
                <td className="px-4 py-3">{event.points ? `+${event.points}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="chunky rounded-2xl bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
