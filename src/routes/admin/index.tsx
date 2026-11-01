import { createFileRoute, Link } from "@tanstack/react-router";
import { OverviewCharts } from "@/components/admin/overview-charts";
import { useClassFilter, useFilteredStudents } from "@/components/admin/class-filter";
import { classAverages, leaderboard } from "@/lib/auth/analytics";
import { studentStatus } from "@/lib/auth/scoring";
import { listStudents } from "@/lib/auth/store";
import { classFilterLabel } from "@/lib/auth/types";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Tutor overview — Code the World" },
      { name: "description", content: "Class charts for games, errors, scores, and daily activity." },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const { filter } = useClassFilter();
  const students = useFilteredStudents();
  const ranks = leaderboard(students).slice(0, 5);
  const liveCount = students.filter((student) => student.liveSession).length;
  return (
    <main>
      <h1 className="font-display text-4xl font-bold">Class overview</h1>
      <p className="mt-2 text-muted-foreground">{classFilterLabel(filter)} · {students.length} students · {liveCount} playing right now</p>
      <div className="mt-6">
        <OverviewCharts students={students} liveCount={liveCount} classComparison={classAverages(listStudents())} selectedClass={filter === "all" ? null : filter} />
      </div>
      <section className="chunky mt-6 rounded-2xl bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Top scores</h2>
          <Link to="/admin/leaderboard" className="font-display font-bold text-primary">Full leaderboard</Link>
        </div>
        {ranks.length === 0 ? <p className="text-muted-foreground">No students yet.</p> : (
          <ol className="space-y-2">
            {ranks.map(({ rank, student }) => (
              <li key={student.id} className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 px-3 py-2">
                <span className="font-display font-bold">{rank}. {student.username}{student.classGroup ? ` · ${student.classGroup}` : ""}</span>
                <span className="text-sm text-muted-foreground">{studentStatus(student)}</span>
                <span>⭐ {student.score}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
