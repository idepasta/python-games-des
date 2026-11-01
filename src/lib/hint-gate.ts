export const HINT_AFTER_MISSES = 3;
export const SOLUTION_AFTER_MISSES = 5;

/** The hint control appears only after this many failed checks on the current step. */
export function showHintButton(misses: number): boolean {
  return misses >= HINT_AFTER_MISSES;
}

/** The full answer for this step appears after this many failed checks. */
export function showSolution(misses: number): boolean {
  return misses >= SOLUTION_AFTER_MISSES;
}
