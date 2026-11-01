import { beforeEach, describe, expect, it } from "vitest";
import { hooksForGame } from "@/lib/canvas-games";
import { validatePythonStep, pythonMissions } from "@/lib/python-missions";
import { runPython } from "@/lib/python-vm";
import { logLevelCleared } from "@/lib/auth/scoring";
import { findUser, registerStudent } from "@/lib/auth/store";

beforeEach(() => {
  localStorage.clear();
});

const othello = pythonMissions.find((mission) => mission.id === "othello")!;
const platformer = pythonMissions.find((mission) => mission.id === "logic-platformer")!;

describe("canvas game bridge", () => {
  it("slides a checker and crashes a jump that has no black piece", () => {
    const cleared = runPython("move_right()\nmove_right()\n", [], hooksForGame("checkers", 1));
    expect(cleared.game?.status).toBe("win");
    const missed = runPython("move_right()\n", [], hooksForGame("checkers", 2));
    expect(missed.status).toBe("error");
    expect(missed.error).toContain("black");
    expect(missed.game?.status).toBe("crash");
  });

  it("flips every othello disc from a corner square", () => {
    const code = `move_right()
move_right()
move_right()
play()
`;
    const result = runPython(code, [], hooksForGame("othello", 2));
    expect(result.game?.status).toBe("win");
    const last = result.game?.frames[result.game.frames.length - 1];
    expect(last?.rows.flat().includes("B")).toBe(false);
  });

  it("knocks bowling pins and reports a gutter", () => {
    const strike = runPython("roll()\nroll()\n", [], hooksForGame("bowling", 1));
    expect(strike.game?.status).toBe("win");
    const gutter = runPython("roll()\nroll()\nroll()\n", [], hooksForGame("bowling", 2));
    expect(gutter.status).toBe("error");
    expect(gutter.error).toContain("gutter");
  });

  it("lets flap() and coast() clear an easy pipe", () => {
    const flight = runPython("flap()\ncoast()\ncoast()\n", [], hooksForGame("flappy", 1));
    expect(flight.game?.status).toBe("win");
    const hit = runPython("coast()\ncoast()\n", [], hooksForGame("flappy", 1));
    expect(hit.game?.status).toBe("crash");
    expect(hit.error).toContain("pipe");
  });

  it("plays a platformer script until the flag or a fall", () => {
    const win = runPython("run(6)\n", [], hooksForGame("platformer", 1));
    expect(win.game?.status, win.game?.message).toBe("win");
    const fall = runPython("run(8)\n", [], hooksForGame("platformer", 2));
    expect(fall.game?.status).toBe("crash");
    expect(fall.game?.message).toContain("fell");
  });

  it("accepts the taught solutions for every canvas step", () => {
    const othelloCode = [
      "play()\n",
      "move_right()\nmove_right()\nmove_right()\nplay()\n",
      `while can_play() != "yes":
    move_right()
play()
`,
      `if can_play() == "yes":
    play()
move_down()
move_down()
if can_play() == "yes":
    play()
`,
    ];
    const platformCode = [
      "run(6)\n",
      "run(3)\njump()\nrun(3)\n",
      "run(2)\njump()\nrun(1)\njump()\nrun(3)\n",
      "run(2)\njump()\nwait(0.7)\nrun(1)\njump()\nwait(0.7)\nrun(3)\n",
    ];
    othello.steps.forEach((step, index) => {
      expect(validatePythonStep(step, othelloCode[index]!).ok, step.id).toBe(true);
    });
    platformer.steps.forEach((step, index) => {
      const check = validatePythonStep(step, platformCode[index]!);
      expect(check.ok, `${step.id}: ${check.message}`).toBe(true);
    });
  });

  it("records a cleared level without giving it step points", async () => {
    localStorage.clear();
    const created = await registerStudent("Mina-Ore", "pass", "A1");
    if (!created.ok) throw new Error("setup failed");
    logLevelCleared("Mina-Ore", {
      area: "python",
      missionId: "othello",
      missionTitle: "Othello",
      stepId: "drop",
      stepTitle: "Drop one disc",
    }, "Every black disc flipped to white.", "play()\n");
    const saved = findUser("mina-ore")!;
    expect(saved.history.some((event) => event.kind === "level_cleared")).toBe(true);
    expect(saved.score).toBe(0);
  });
});
