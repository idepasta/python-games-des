import { classAverages, type ClassAverage } from "@/lib/auth/analytics";
import { completionPercent, errorRate, gamesFinished, studentStatus, TOTAL_GAMES } from "@/lib/auth/scoring";
import type { HistoryKind, UserRecord } from "@/lib/auth/types";

const KIND_LABEL: Record<HistoryKind, string> = {
  step_passed: "Step passed",
  error_made: "Error",
  game_completed: "Game finished",
  session_stopped: "Left step",
  level_cleared: "Level cleared",
};

export type ReportScope = {
  filterLabel: string;
  students: UserRecord[];
};

export type StudentRow = {
  Username: string;
  Class: string;
  Score: number;
  "Games completed": string;
  "Completion percent": number;
  "Error rate": number;
  Status: string;
};

export type HistoryRow = {
  Username: string;
  Class: string;
  When: string;
  Event: string;
  Area: string;
  Mission: string;
  Step: string;
  Points: number;
  Seconds: number;
  "Error type": string;
  Message: string;
  Code: string;
};

export type ClassRow = {
  Rank: number;
  Class: string;
  Students: number;
  "Average score": number;
};

function classLabel(student: UserRecord): string {
  return student.classGroup || "Unassigned";
}

export function classRows(comparison: ClassAverage[]): ClassRow[] {
  return comparison.map((row, index) => ({
    Rank: index + 1,
    Class: row.classGroup,
    Students: row.students,
    "Average score": row.averageScore,
  }));
}

export function studentRows(students: UserRecord[]): StudentRow[] {
  return students.map((student) => ({
    Username: student.username,
    Class: classLabel(student),
    Score: student.score,
    "Games completed": `${gamesFinished(student.progress)}/${TOTAL_GAMES}`,
    "Completion percent": completionPercent(student.progress),
    "Error rate": errorRate(student.history),
    Status: studentStatus(student),
  }));
}

export function historyRows(students: UserRecord[]): HistoryRow[] {
  return students
    .flatMap((student) => student.history.map((event) => ({ student, event })))
    .sort((a, b) => b.event.at.localeCompare(a.event.at))
    .map(({ student, event }) => ({
      Username: student.username,
      Class: classLabel(student),
      When: event.at,
      Event: KIND_LABEL[event.kind],
      Area: event.area,
      Mission: event.missionTitle,
      Step: event.stepTitle,
      Points: event.points,
      Seconds: event.seconds,
      "Error type": event.errorType,
      Message: event.message,
      Code: event.codeSnippet,
    }));
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function csvTable(title: string, rows: Record<string, string | number>[]): string[] {
  if (rows.length === 0) return [title, "No rows"];
  const headers = Object.keys(rows[0]);
  return [
    title,
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header] ?? "")).join(",")),
  ];
}

export function reportToCsv(scope: ReportScope): string {
  const comparison = classRows(classAverages(scope.students));
  const lines = [
    "Code the World tutor report",
    csvCell(`Class filter: ${scope.filterLabel}`),
    csvCell(`Generated: ${new Date().toISOString()}`),
    "",
    ...csvTable("Class comparison", comparison),
    "",
    ...csvTable("Students", studentRows(scope.students)),
    "",
    ...csvTable("History", historyRows(scope.students)),
    "",
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function reportFilename(scope: ReportScope, extension: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const slug = scope.filterLabel.toLowerCase().replace(/\s+/g, "-");
  return `code-the-world-${slug}-${day}.${extension}`;
}

export function downloadCsv(scope: ReportScope) {
  downloadBlob(reportFilename(scope, "csv"), new Blob([reportToCsv(scope)], { type: "text/csv;charset=utf-8" }));
}

export async function downloadSpreadsheet(scope: ReportScope) {
  const XLSX = await import("xlsx");
  const book = XLSX.utils.book_new();
  const add = (name: string, rows: Record<string, string | number>[]) => {
    const sheet = rows.length ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([["No rows"]]);
    XLSX.utils.book_append_sheet(book, sheet, name);
  };
  add("Class comparison", classRows(classAverages(scope.students)));
  add("Students", studentRows(scope.students));
  add("History", historyRows(scope.students));
  XLSX.writeFile(book, reportFilename(scope, "xlsx"));
}

function pdfSafe(value: string | number): string {
  return String(value).replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ");
}

export async function downloadPdf(scope: ReportScope) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(18);
  doc.text("Code the World tutor report", 40, 40);
  doc.setFontSize(11);
  doc.text(pdfSafe(`Class filter: ${scope.filterLabel}`), 40, 62);
  doc.text(pdfSafe(`Generated: ${new Date().toLocaleString("en-US")}`), 40, 78);

  const classes = classRows(classAverages(scope.students));
  const students = studentRows(scope.students);
  const history = historyRows(scope.students).slice(0, 80);

  autoTable(doc, {
    startY: 96,
    head: [["Rank", "Class", "Students", "Average score"]],
    body: classes.length ? classes.map((row) => [row.Rank, row.Class, row.Students, row["Average score"]]) : [["", "No classes yet", "", ""]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  autoTable(doc, {
    head: [["Username", "Class", "Score", "Games", "Completion", "Error rate", "Status"]],
    body: students.length
      ? students.map((row) => [row.Username, row.Class, row.Score, row["Games completed"], `${row["Completion percent"]}%`, `${row["Error rate"]}%`, pdfSafe(row.Status)])
      : [["No students in this view", "", "", "", "", "", ""]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  autoTable(doc, {
    head: [["When", "Student", "Class", "Event", "Mission", "Step", "Message", "Code"]],
    body: history.length
      ? history.map((row) => [row.When.slice(0, 19).replace("T", " "), row.Username, row.Class, row.Event, pdfSafe(row.Mission), pdfSafe(row.Step), pdfSafe(row.Message), pdfSafe(row.Code).slice(0, 80)])
      : [["No history in this view", "", "", "", "", "", "", ""]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  if (historyRows(scope.students).length > history.length) {
    const last = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 500;
    doc.setFontSize(10);
    doc.text("History continues beyond the first 80 events. Use the spreadsheet export for the full log.", 40, last + 24);
  }

  doc.save(reportFilename(scope, "pdf"));
}
