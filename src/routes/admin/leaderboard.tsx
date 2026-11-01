import { createFileRoute, Link } from "@tanstack/react-router";
import { useClassFilter, useFilteredStudents } from "@/components/admin/class-filter";
import { classAverages, leaderboard } from "@/lib/auth/analytics";
import { completionPercent, gamesFinished, studentStatus, TOTAL_GAMES } from "@/lib/auth/scoring";
import { listStudents } from "@/lib/auth/store";
import { classFilterLabel } from "@/lib/auth/types";

export const Route = createFileRoute("/admin/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Code the World" },
      { name: "description", content: "Students ranked by total score." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { filter } = useClassFilter();
  const ranks = leaderboard(useFilteredStudents());
  const classes = classAverages(listStudents());
  return (
    <main>
      <h1 className="font-display text-4xl font-bold">Leaderboard</h1>
      <p className="mt-2 text-muted-foreground">Ranked by total score in {classFilterLabel(filter)}. Ties break by username.</p>
      <div className="chunky mt-6 overflow-x-auto rounded-2xl bg-card">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-secondary font-display">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Games</th>
              <th className="px-4 py-3">Completion</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {ranks.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-muted-foreground">No students in this class yet.</td></tr>
            )}
            {ranks.map(({ rank, student }) => (
              <tr key={student.id} className="border-t border-foreground/10">
                <td className="px-4 py-3 font-display font-bold">{rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}</td>
                <td className="px-4 py-3">
                  <Link to="/admin/students/$username" params={{ username: student.username }} className="font-display font-bold text-primary">
                    {student.username}
                  </Link>
                </td>
                <td className="px-4 py-3">{student.classGroup || "—"}</td>
                <td className="px-4 py-3">⭐ {student.score}</td>
                <td className="px-4 py-3">{gamesFinished(student.progress)} / {TOTAL_GAMES}</td>
                <td className="px-4 py-3">{completionPercent(student.progress)}%</td>
                <td className="px-4 py-3">{studentStatus(student)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="chunky mt-6 overflow-x-auto rounded-2xl bg-card">
        <h2 className="px-4 pt-4 font-display text-lg font-bold">Class comparison</h2>
        <p className="px-4 pb-3 text-sm text-muted-foreground">Average score in each class. This list always includes every class.</p>
        <table className="w-full min-w-[480px] text-left">
          <thead className="bg-secondary font-display">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Students</th>
              <th className="px-4 py-3">Average score</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-muted-foreground">No classes to compare yet.</td></tr>
            )}
            {classes.map((row, index) => (
              <tr key={row.classGroup} className={`border-t border-foreground/10 ${filter === row.classGroup ? "bg-primary/10" : ""}`}>
                <td className="px-4 py-3 font-display font-bold">{index + 1}</td>
                <td className="px-4 py-3">{row.classGroup}</td>
                <td className="px-4 py-3">{row.students}</td>
                <td className="px-4 py-3">⭐ {row.averageScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
