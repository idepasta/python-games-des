import { stepReachable } from "@/lib/mission-lock";

export function StepSwitcher({
  titles,
  index,
  passed,
  onGo,
}: {
  titles: string[];
  index: number;
  passed: boolean[];
  onGo: (index: number) => void;
}) {
  return (
    <div className="mb-3 space-y-2">
      <div className="flex gap-1" aria-label="Mission steps">
        {titles.map((title, i) => {
          const open = stepReachable(i, index, passed);
          return (
            <button
              key={`${i}-${title}`}
              type="button"
              aria-label={`Go to step ${i + 1}: ${title}`}
              aria-current={i === index ? "step" : undefined}
              disabled={!open}
              onClick={() => onGo(i)}
              className={`h-3 flex-1 rounded disabled:cursor-not-allowed ${i === index ? "bg-warn" : passed[i] ? "bg-go" : "bg-off/40"}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!stepReachable(index - 1, index, passed)}
          onClick={() => onGo(index - 1)}
          className="press rounded-lg bg-secondary px-4 py-2 font-display font-bold disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Previous step
        </button>
        <button
          type="button"
          disabled={!stepReachable(index + 1, index, passed)}
          onClick={() => onGo(index + 1)}
          className="press rounded-lg bg-secondary px-4 py-2 font-display font-bold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next step →
        </button>
      </div>
    </div>
  );
}
