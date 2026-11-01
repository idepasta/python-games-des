import { createFileRoute, Link } from "@tanstack/react-router";
import { useClassFilter, useFilteredStudents } from "@/components/admin/class-filter";
import { errorRate, gamesFinished, studentStatus, TOTAL_GAMES } from "@/lib/auth/scoring";
import { classFilterLabel } from "@/lib/auth/types";

export const Route = createFileRoute("/admin/students/")({
  head: () => ({
    meta: [
      { title: "Students — Code the World" },
      { name: "description", content: "Every student, their score, and where they stopped." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const { filter } = useClassFilter();
  const students = useFilteredStudents();
  return (
    <main>
      <h1 className="font-display text-4xl font-bold">Students</h1>
      <p className="mt-2 text-muted-foreground">Open a student in {classFilterLabel(filter)} to grade their steps, errors, and time.</p>
      <div className="chunky mt-6 overflow-x-auto rounded-2xl bg-card">
        <table className="w-full min-w-[760px] text-left">
          <thead className="bg-secondary font-display">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Games</th>
              <th className="px-4 py-3">Error rate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Grade</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-muted-foreground">No students in this class yet.</td></tr>
            )}
            {students.map((student) => (
              <tr key={student.id} className="border-t border-foreground/10">
                <td className="px-4 py-3 font-display font-bold">{student.username}</td>
                <td className="px-4 py-3">{student.classGroup || "—"}</td>
                <td className="px-4 py-3">⭐ {student.score}</td>
                <td className="px-4 py-3">{gamesFinished(student.progress)} / {TOTAL_GAMES}</td>
                <td className="px-4 py-3">{errorRate(student.history)}%</td>
                <td className="px-4 py-3">{studentStatus(student)}</td>
                <td className="px-4 py-3">
                  <Link to="/admin/students/$username" params={{ username: student.username }} className="font-display font-bold text-primary">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
