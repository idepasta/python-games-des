import { describe, it, expect } from "vitest";
import { realRange, speedFine, pumpOn, lightsOn, thermostatStep } from "@/lib/rules";

describe("rules", () => {
  it("EV range at -5°C is 240km", () => expect(realRange(400, -5)).toBe(240));
  it("EV range at 20°C is full", () => expect(realRange(400, 20)).toBe(400));
  it("fine is €5 per km over 100", () => expect(speedFine(120)).toBe(100));
  it("no fine at limit", () => expect(speedFine(100)).toBe(0));
  it("pump under 10cm", () => { expect(pumpOn(9)).toBe(true); expect(pumpOn(10)).toBe(false); });
  it("lights under 25%", () => { expect(lightsOn(24)).toBe(true); expect(lightsOn(25)).toBe(false); });
  it("thermostat heats below 20", () => expect(thermostatStep(18).t).toBe(20));
});
