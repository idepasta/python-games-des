import type { Role } from "@/lib/auth/types";

/** Students open the next mission only after finishing the one before it. The tutor can open every mission. */
export function missionLocked(role: Role | undefined, index: number, previousDone: boolean): boolean {
  if (role === "admin") return false;
  return index > 0 && !previousDone;
}

/** Phone games start with Tic-Tac-Toe, then each Python mission in order. */
export function phoneGameLocked(
  role: Role | undefined,
  index: number,
  ticTacToeDone: boolean,
  pythonDone: readonly string[],
  missionIds: readonly string[],
): boolean {
  if (role === "admin") return false;
  if (index <= 0) return !ticTacToeDone;
  return !pythonDone.includes(missionIds[index - 1] ?? "");
}

/** A step already passed can be reopened. The next step opens only after the current one is passed. */
export function stepReachable(target: number, current: number, passed: readonly boolean[]): boolean {
  if (target < 0 || target >= passed.length) return false;
  if (target === current) return true;
  if (target < current) return passed[target] === true;
  return target === current + 1 && passed[current] === true;
}
