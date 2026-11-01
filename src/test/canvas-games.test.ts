import { beforeEach, describe, expect, it } from "vitest";
import { hooksForGame } from "@/lib/canvas-games";
import { validatePythonStep, pythonMissions } from "@/lib/python-missions";
import { runPython } from "@/lib/python-vm";
import { logLevelCleared } from "@/lib/auth/scoring";
import { findUser, registerStudent } from "@/lib/auth/store";

beforeEach(() => {
  localStorage.clear();
});

const miner = pythonMissions.find((mission) => mission.id === "python-miner")!;
const platformer = pythonMissions.find((mission) => mission.id === "logic-platformer")!;

describe("canvas game bridge", () => {
  it("mines a path and reports a crash when the miner hits dirt", () => {
    const cleared = runPython("move_right()\nmove_right()\n", [], hooksForGame("miner", 1));
    expect(cleared.game?.status).toBe("win");
    const bumped = runPython("move_right()\nmove_right()\n", [], hooksForGame("miner", 2));
    expect(bumped.status).toBe("error");
    expect(bumped.error).toContain("dirt");
    expect(bumped.game?.status).toBe("crash");
  });

  it("lets a loop read the block in front of the miner", () => {
    const code = `while block_ahead() != "goal":
    if block_ahead() == "air":
        move_right()
    else:
        mine_block()
move_right()
`;
    const result = runPython(code, [], hooksForGame("miner", 4));
    expect(result.game?.status).toBe("win");
    const last = result.game?.frames[result.game.frames.length - 1];
    expect(last?.diamond).toBe(1);
  });

  it("plays a platformer script until the flag or a fall", () => {
    const win = runPython("run(6)\n", [], hooksForGame("platformer", 1));
    expect(win.game?.status, win.game?.message).toBe("win");
    const fall = runPython("run(8)\n", [], hooksForGame("platformer", 2));
    expect(fall.game?.status).toBe("crash");
    expect(fall.game?.message).toContain("fell");
  });

  it("accepts the taught solutions for every canvas step", () => {
    const minerCode = [
      "move_right()\nmove_right()\n",
      "move_right()\nmine_block()\nmove_right()\nmove_right()\n",
      `while block_ahead() != "goal":
    if block_ahead() == "dirt":
        mine_block()
    else:
        move_right()
move_right()
`,
      `while block_ahead() != "goal":
    if block_ahead() == "air":
        move_right()
    else:
        mine_block()
move_right()
`,
      `move_right()
mine_block()
move_right()
place_block("plank")
move_down()
move_right()
`,
    ];
    const platformCode = [
      "run(6)\n",
      "run(3)\njump()\nrun(3)\n",
      "run(2)\njump()\nrun(1)\njump()\nrun(3)\n",
      "run(2)\njump()\nwait(0.7)\nrun(1)\njump()\nwait(0.7)\nrun(3)\n",
    ];
    miner.steps.forEach((step, index) => {
      expect(validatePythonStep(step, minerCode[index]!).ok, step.id).toBe(true);
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
      missionId: "python-miner",
      missionTitle: "Python Miner",
      stepId: "walk",
      stepTitle: "Walk to the goal",
    }, "You cleared the mine!", "move_right()\n");
    const saved = findUser("mina-ore")!;
    expect(saved.history.some((event) => event.kind === "level_cleared")).toBe(true);
    expect(saved.score).toBe(0);
  });
});
