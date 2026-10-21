import { describe, it, expect } from "vitest";
import { radarFine, vendingResult, customizedPython, initialExtras } from "@/lib/extras";
describe("extras", () => {
  it("custom speed fine", () => expect(radarFine(70, false, { a: 50, b: 2, enabled: false })).toBe(40));
  it("ignored bird gets no fine", () => expect(radarFine(90, true, { a: 50, b: 2, enabled: true })).toBe(0));
  it("no stock no snack", () => expect(vendingResult(3, 0, { a: 1.5, b: 0, enabled: false }).dispense).toBe(false));
  it("code changes with toggle", () => expect(customizedPython(3, { ...initialExtras(3), enabled: true }, {}).p2).toContain("is_bird"));
});
