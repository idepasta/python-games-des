// Pure rules mirroring the Python examples, used by the mini games.
export const realRange = (base: number, t: number) =>
  t >= 15 ? base : Math.round(base * (1 - (15 - t) * 0.02));
export const speedFine = (speed: number, limit = 100) =>
  speed > limit ? (speed - limit) * 5 : 0;
export const pumpOn = (cm: number) => cm < 10;
export const lightsOn = (sun: number) => sun < 25;
export const thermostatStep = (t: number) =>
  t < 20 ? { t: t + 2, msg: "🔥 Activating Boiler. Heating the room..." }
  : t >= 24 ? { t: t - 1, msg: "🛑 Target reached. Boiler OFF." }
  : { t: t - 1, msg: "Standby mode." };
