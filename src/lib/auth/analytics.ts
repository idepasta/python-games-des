import { CLASS_GROUPS, type ClassFilter, type ClassGroup, type ScoreEvent, type UserRecord } from "@/lib/auth/types";

export type NamedCount = { name: string; value: number };

export type ClassAverage = {
  classGroup: ClassGroup;
  students: number;
  averageScore: number;
};

export function studentsInClass(students: UserRecord[], filter: ClassFilter): UserRecord[] {
  if (filter === "all") return students;
  return students.filter((student) => student.classGroup === filter);
}

export function classAverages(students: UserRecord[]): ClassAverage[] {
  return CLASS_GROUPS.map((classGroup) => {
    const group = students.filter((student) => student.classGroup === classGroup);
    const total = group.reduce((sum, student) => sum + student.score, 0);
    return {
      classGroup,
      students: group.length,
      averageScore: group.length ? Math.round(total / group.length) : 0,
    };
  })
    .filter((row) => row.students > 0)
    .sort((a, b) => b.averageScore - a.averageScore || a.classGroup.localeCompare(b.classGroup));
}

export function leaderboard(students: UserRecord[]) {
  return [...students]
    .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username))
    .map((student, index) => ({ rank: index + 1, student }));
}

function latestMission(history: ScoreEvent[]): string | null {
  const event = [...history].reverse().find((item) => item.missionTitle && item.kind !== "error_made");
  return event?.missionTitle ?? null;
}

export function playingMix(students: UserRecord[]): NamedCount[] {
  const counts = new Map<string, number>();
  for (const student of students) {
    const name = student.liveSession?.missionTitle ?? latestMission(student.history);
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, value]) => ({ name, value }));
}

export function commonErrors(students: UserRecord[]): NamedCount[] {
  const counts = new Map<string, number>();
  for (const student of students) {
    for (const event of student.history) {
      if (event.kind !== "error_made") continue;
      const name = (event.message || "Unknown error").slice(0, 48);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

export function averageScoreByGame(students: UserRecord[]): NamedCount[] {
  const buckets = new Map<string, { points: number; players: Set<string> }>();
  for (const student of students) {
    for (const event of student.history) {
      if (event.kind !== "step_passed" && event.kind !== "game_completed") continue;
      const bucket = buckets.get(event.missionTitle) ?? { points: 0, players: new Set<string>() };
      bucket.points += event.points;
      bucket.players.add(student.username);
      buckets.set(event.missionTitle, bucket);
    }
  }
  return [...buckets.entries()].map(([name, bucket]) => ({
    name,
    value: bucket.players.size ? Math.round(bucket.points / bucket.players.size) : 0,
  }));
}

export function engagementByDay(students: UserRecord[], days = 7): { day: string; events: number }[] {
  const rows: { day: string; events: number }[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    const events = students.reduce((sum, student) => sum + student.history.filter((item) => item.at.slice(0, 10) === key).length, 0);
    rows.push({ day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), events });
  }
  return rows;
}
