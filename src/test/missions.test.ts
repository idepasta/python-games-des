import { describe, expect, it } from "vitest";
import { checkBlank, missions, blankCount } from "@/lib/missions";

describe("hacker missions", () => {
  it("accepts single quotes and extra spaces", () => {
    expect(checkBlank(" 'snake' ", ['"snake"'])).toBe(true);
  });
  it("rejects a string without quotes", () => {
    expect(checkBlank("snake", ['"snake"'])).toBe(false);
  });
  it("rejects = when == is required", () => {
    expect(checkBlank("=", ["=="])).toBe(false);
  });
  it("every step has one answer list per blank", () => {
    for (const m of missions) for (const s of m.steps) expect(s.answers.length).toBe(blankCount(s.code));
  });
  it("safe opens only on 42", () => {
    const safe = missions[1]!;
    expect(safe.run("41").lines).toEqual(["Πιο πάνω!"]);
    expect(safe.run("42").hacked).toBe(true);
  });
  it("firewall needs blue and level 5 or more", () => {
    const fw = missions[3]!;
    expect(fw.run("blue 5").hacked).toBe(true);
    expect(fw.run("blue 4").hacked).toBe(false);
    expect(fw.run("red 9").hacked).toBe(false);
  });
});
