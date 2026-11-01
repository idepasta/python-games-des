import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { averageScoreByGame, commonErrors, engagementByDay, playingMix, type ClassAverage, type NamedCount } from "@/lib/auth/analytics";
import type { ClassGroup, UserRecord } from "@/lib/auth/types";

const COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="chunky rounded-2xl bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      <div className="h-64">{children}</div>
    </section>
  );
}

function EmptyChart({ text }: { text: string }) {
  return <p className="grid h-full place-items-center text-center text-sm text-muted-foreground">{text}</p>;
}

export function OverviewCharts({
  students,
  liveCount,
  classComparison,
  selectedClass,
}: {
  students: UserRecord[];
  liveCount: number;
  classComparison: ClassAverage[];
  selectedClass: ClassGroup | null;
}) {
  const mix = playingMix(students);
  const errors = commonErrors(students);
  const scores = averageScoreByGame(students);
  const line = engagementByDay(students);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title={liveCount > 0 ? "Games being played now" : "Latest game per student"}>
        {mix.length === 0 ? <EmptyChart text="No game activity yet." /> : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={mix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {mix.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <ChartCard title="Most common errors">
        {errors.length === 0 ? <EmptyChart text="No errors have been logged yet." /> : (
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={errors} layout="vertical" margin={{ left: 24, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" name="Errors" fill="#ef4444" />
          </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <ChartCard title="Average points per game">
        {scores.length === 0 ? <EmptyChart text="Points appear after students pass a step." /> : (
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scores as NamedCount[]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={60} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" name="Average points" fill="#3b82f6" />
          </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <ChartCard title="Average score by class">
        {classComparison.length === 0 ? <EmptyChart text="Class averages appear after students join." /> : (
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={classComparison.map((row) => ({ name: row.classGroup, value: row.averageScore }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" name="Average score">
              {classComparison.map((row) => (
                <Cell key={row.classGroup} fill={!selectedClass || row.classGroup === selectedClass ? "#3b82f6" : "#cbd5e1"} />
              ))}
            </Bar>
          </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
      <ChartCard title="Class activity, last 7 days">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart data={line}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="events" name="Events" stroke="#22c55e" strokeWidth={3} dot />
        </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
