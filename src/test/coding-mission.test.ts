import { describe, expect, it } from "vitest";
import {
  checkStep,
  checkWinner,
  codeWithNextStep,
  parseProgram,
  starterCode,
  ticTacToeMission,
} from "@/lib/coding-mission";

describe("coding mission parser", () => {
  it("reads strings, numbers, booleans, and ignores comments", () => {
    const { program, errors } = parseProgram(`
# comment
title = "Tic-Tac-Toe"
x_mark = 'X'
grid_size = 3
turns_on = True
`);
    expect(errors).toEqual([]);
    expect(program.title).toBe("Tic-Tac-Toe");
    expect(program.xMark).toBe("X");
    expect(program.gridSize).toBe(3);
    expect(program.turnsOn).toBe(true);
  });

  it("rejects unknown names", () => {
    const { errors } = parseProgram("banana = 1");
    expect(errors[0]).toMatch(/unknown name/i);
  });
});

describe("tic-tac-toe steps", () => {
  it("starts on the title step", () => {
    const code = starterCode(ticTacToeMission, 0);
    expect(checkStep(ticTacToeMission, 0, code).ok).toBe(false);
    expect(checkStep(ticTacToeMission, 0, 'title = "Tic-Tac-Toe"').ok).toBe(true);
  });

  it("requires different player marks", () => {
    const code = 'title = "Tic-Tac-Toe"\nx_mark = "X"\no_mark = "X"';
    expect(checkStep(ticTacToeMission, 1, code).ok).toBe(false);
    expect(checkStep(ticTacToeMission, 1, 'title = "Tic-Tac-Toe"\nx_mark = "X"\no_mark = "O"').ok).toBe(true);
  });

  it("requires a 3x3 board, turns, winner check, and reset", () => {
    const base = 'title = "Tic-Tac-Toe"\nx_mark = "X"\no_mark = "O"\ngrid_size = 3\n';
    expect(checkStep(ticTacToeMission, 2, `${base}grid_size = 4`).ok).toBe(false);
    expect(checkStep(ticTacToeMission, 2, base).ok).toBe(true);
    expect(checkStep(ticTacToeMission, 3, `${base}turns_on = True`).ok).toBe(true);
    expect(checkStep(ticTacToeMission, 4, `${base}check_winner = True`).ok).toBe(true);
    expect(checkStep(ticTacToeMission, 5, `${base}reset_button = True`).ok).toBe(true);
  });

  it("appends the next starter block when advancing", () => {
    const next = codeWithNextStep('title = "Tic-Tac-Toe"\n', ticTacToeMission, 1);
    expect(next).toContain("x_mark");
  });
});

describe("winner rules", () => {
  it("finds a row, a diagonal, and a draw", () => {
    expect(checkWinner(["X", "X", "X", "O", "O", null, null, null, null], 3)).toBe("X");
    expect(checkWinner(["X", "O", null, null, "X", "O", null, null, "X"], 3)).toBe("X");
    expect(checkWinner(["X", "O", "X", "X", "O", "O", "O", "X", "X"], 3)).toBe("draw");
    expect(checkWinner(["X", "O", null, null, null, null, null, null, null], 3)).toBe(null);
  });
});
