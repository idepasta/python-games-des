import { createContext, useContext, useState, type ReactNode } from "react";
import { classFilterLabel, CLASS_GROUPS, type ClassFilter } from "@/lib/auth/types";
import { studentsInClass } from "@/lib/auth/analytics";
import { listStudents } from "@/lib/auth/store";
import { downloadCsv, downloadPdf, downloadSpreadsheet, type ReportScope } from "@/lib/auth/export-report";

const ClassFilterContext = createContext<{
  filter: ClassFilter;
  setFilter: (filter: ClassFilter) => void;
}>({ filter: "all", setFilter: () => {} });

export function ClassFilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<ClassFilter>("all");
  return <ClassFilterContext.Provider value={{ filter, setFilter }}>{children}</ClassFilterContext.Provider>;
}

export function useClassFilter() {
  return useContext(ClassFilterContext);
}

export function useFilteredStudents() {
  const { filter } = useClassFilter();
  return studentsInClass(listStudents(), filter);
}

export function AdminToolbar() {
  const { filter, setFilter } = useClassFilter();
  const students = useFilteredStudents();
  const scope: ReportScope = { filterLabel: classFilterLabel(filter), students };
  const [busy, setBusy] = useState<"" | "sheet" | "pdf">("");

  const run = async (kind: "sheet" | "pdf", task: () => Promise<void>) => {
    setBusy(kind);
    try {
      await task();
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="chunky mb-6 flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-card p-4">
      <label className="font-display font-bold" htmlFor="class-filter">
        Class
        <select
          id="class-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value as ClassFilter)}
          className="mt-1 block min-w-44 rounded-xl border-[3px] border-foreground bg-background px-3 py-2 font-sans font-normal"
        >
          <option value="all">All Classes</option>
          {CLASS_GROUPS.map((group) => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => downloadCsv(scope)} className="press rounded-xl bg-primary px-4 py-2 font-display font-bold text-primary-foreground">
          Export CSV
        </button>
        <button type="button" disabled={busy === "sheet"} onClick={() => run("sheet", () => downloadSpreadsheet(scope))} className="press rounded-xl bg-primary px-4 py-2 font-display font-bold text-primary-foreground disabled:opacity-50">
          {busy === "sheet" ? "Preparing..." : "Export Spreadsheet"}
        </button>
        <button type="button" disabled={busy === "pdf"} onClick={() => run("pdf", () => downloadPdf(scope))} className="press rounded-xl bg-accent px-4 py-2 font-display font-bold text-accent-foreground disabled:opacity-50">
          {busy === "pdf" ? "Preparing..." : "Export PDF"}
        </button>
      </div>
    </div>
  );
}
