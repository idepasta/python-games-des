export type CellMark = string | null;
export type PlayerTurn = "x" | "o";

export type MissionProgram = {
  title?: string;
  xMark?: string;
  oMark?: string;
  gridSize?: number;
  turnsOn?: boolean;
  checkWinner?: boolean;
  resetButton?: boolean;
};

export type ParseResult = {
  program: MissionProgram;
  errors: string[];
};

export type StepCheck = { ok: boolean; message: string };

export type CodingStep = {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  win: string;
  appendCode: string;
  check: (program: MissionProgram) => StepCheck;
};

export type CodingMission = {
  id: string;
  emoji: string;
  title: string;
  story: string;
  steps: CodingStep[];
};

const KEYS = ["title", "x_mark", "o_mark", "grid_size", "turns_on", "check_winner", "reset_button"] as const;
type ProgramKey = (typeof KEYS)[number];

const FIELD_MAP: Record<ProgramKey, keyof MissionProgram> = {
  title: "title",
  x_mark: "xMark",
  o_mark: "oMark",
  grid_size: "gridSize",
  turns_on: "turnsOn",
  check_winner: "checkWinner",
  reset_button: "resetButton",
};

export function stripComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === "#" && !inSingle && !inDouble) return line.slice(0, i);
  }
  return line;
}

function parseValue(raw: string): { ok: true; value: string | number | boolean } | { ok: false; error: string } {
  const value = raw.trim();
  if (value === "True") return { ok: true, value: true };
  if (value === "False") return { ok: true, value: false };
  if ((value.startsWith('"') && value.endsWith('"') && value.length >= 2)
    || (value.startsWith("'") && value.endsWith("'") && value.length >= 2)) {
    return { ok: true, value: value.slice(1, -1) };
  }
  if (/^-?\d+$/.test(value)) return { ok: true, value: Number(value) };
  return { ok: false, error: `I do not understand ${value}. Use quotes for words, True/False for switches, and numbers without quotes.` };
}

export function parseProgram(code: string): ParseResult {
  const program: MissionProgram = {};
  const errors: string[] = [];
  const lines = code.split(/\n/);
  lines.forEach((line, index) => {
    const body = stripComment(line).trim();
    if (!body) return;
    const match = body.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    if (!match) {
      errors.push(`Line ${index + 1}: each instruction should look like name = value.`);
      return;
    }
    const key = match[1] as ProgramKey;
    if (!KEYS.includes(key)) {
      errors.push(`Line ${index + 1}: unknown name "${key}".`);
      return;
    }
    const parsed = parseValue(match[2] ?? "");
    if (!parsed.ok) {
      errors.push(`Line ${index + 1}: ${parsed.error}`);
      return;
    }
    const field = FIELD_MAP[key];
    (program as Record<string, string | number | boolean>)[field] = parsed.value;
  });
  return { program, errors };
}

export function checkWinner(cells: CellMark[], size: number): CellMark | "draw" {
  if (size < 1 || cells.length !== size * size) return null;
  const lines: number[][] = [];
  for (let i = 0; i < size; i += 1) {
    lines.push(Array.from({ length: size }, (_, j) => i * size + j));
    lines.push(Array.from({ length: size }, (_, j) => j * size + i));
  }
  lines.push(Array.from({ length: size }, (_, i) => i * size + i));
  lines.push(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)));
  for (const line of lines) {
    const first = cells[line[0] ?? -1];
    if (first && line.every((idx) => cells[idx] === first)) return first;
  }
  if (cells.every(Boolean)) return "draw";
  return null;
}

export const ticTacToeMission: CodingMission = {
  id: "tic-tac-toe",
  emoji: "📱",
  title: "Build Tic-Tac-Toe",
  story: "You are making a tiny phone game. Type Python-style settings on the left. The phone on the right updates while you type. Finish each step, then tap Next Step.",
  steps: [
    {
      id: "title",
      title: "Name the game",
      instruction: "Set title to a fun name in quotes. The name appears at the top of the phone.",
      hint: 'Write title = "Tic-Tac-Toe" with quotes around the words.',
      win: "Great! The phone now has a title.",
      appendCode: `# Step 1: Name the game that will appear on the phone.
title = ""
`,
      check: (p) => (p.title && p.title.trim()
        ? { ok: true, message: "Great! The phone now has a title." }
        : { ok: false, message: "Give title a name inside quotes." }),
    },
    {
      id: "marks",
      title: "Choose the player marks",
      instruction: "Players need two different marks. Set x_mark and o_mark to short strings such as \"X\" and \"O\".",
      hint: 'Try x_mark = "X" and o_mark = "O". They must be different.',
      win: "Nice! Two players are ready.",
      appendCode: `
# Step 2: Choose a mark for each player.
x_mark = ""
o_mark = ""
`,
      check: (p) => {
        if (!p.xMark?.trim() || !p.oMark?.trim()) return { ok: false, message: "Fill in both x_mark and o_mark with quoted text." };
        if (p.xMark === p.oMark) return { ok: false, message: "The two marks must be different." };
        return { ok: true, message: "Nice! Two players are ready." };
      },
    },
    {
      id: "board",
      title: "Draw a 3x3 board",
      instruction: "Classic Tic-Tac-Toe uses a 3 by 3 grid. Set grid_size to the number 3 (no quotes).",
      hint: "Numbers do not need quotes. Write grid_size = 3",
      win: "The board is on the phone!",
      appendCode: `
# Step 3: Make a 3 by 3 board.
grid_size = 0
`,
      check: (p) => (p.gridSize === 3
        ? { ok: true, message: "The board is on the phone!" }
        : { ok: false, message: "Set grid_size to 3 with no quotes." }),
    },
    {
      id: "turns",
      title: "Turn on tapping",
      instruction: "Kids should tap empty squares to play. Set turns_on to True so X and O take turns.",
      hint: "Python uses True and False with a capital letter. Write turns_on = True",
      win: "Tap a square on the phone to play a turn.",
      appendCode: `
# Step 4: Let players tap squares to take turns.
turns_on = False
`,
      check: (p) => (p.turnsOn === true
        ? { ok: true, message: "Tap a square on the phone to play a turn." }
        : { ok: false, message: "Set turns_on = True so the board can be tapped." }),
    },
    {
      id: "winner",
      title: "Find the winner",
      instruction: "A player wins with three matching marks in a row, column, or diagonal. Set check_winner to True.",
      hint: "Write check_winner = True",
      win: "The phone can now shout who won!",
      appendCode: `
# Step 5: Check for three in a row.
check_winner = False
`,
      check: (p) => (p.checkWinner === true
        ? { ok: true, message: "The phone can now shout who won!" }
        : { ok: false, message: "Set check_winner = True." }),
    },
    {
      id: "reset",
      title: "Add a new-game button",
      instruction: "Add a reset button so friends can play again. Set reset_button to True.",
      hint: "Write reset_button = True",
      win: "Mission complete! You built a Tic-Tac-Toe phone game.",
      appendCode: `
# Step 6: Add a button that starts a new game.
reset_button = False
`,
      check: (p) => (p.resetButton === true
        ? { ok: true, message: "Mission complete! You built a Tic-Tac-Toe phone game." }
        : { ok: false, message: "Set reset_button = True to show the New Game button." }),
    },
  ],
};

const TIC_TAC_TOE_PARTS = [
  `# Step 1: Name the game that will appear on the phone.\ntitle = "Tic-Tac-Toe"\n`,
  `\n# Step 2: Choose a mark for each player.\nx_mark = "X"\no_mark = "O"\n`,
  `\n# Step 3: Make a 3 by 3 board.\ngrid_size = 3\n`,
  `\n# Step 4: Let players tap squares to take turns.\nturns_on = True\n`,
  `\n# Step 5: Check for three in a row.\ncheck_winner = True\n`,
  `\n# Step 6: Add a button that starts a new game.\nreset_button = True\n`,
];

export function ticTacToeSolution(stepIndex: number): string {
  return TIC_TAC_TOE_PARTS.slice(0, stepIndex + 1).join("");
}

export function starterCode(mission: CodingMission, stepIndex = 0): string {
  return mission.steps.slice(0, stepIndex + 1).map((step) => step.appendCode).join("");
}

export function codeWithNextStep(code: string, mission: CodingMission, nextIndex: number): string {
  const next = mission.steps[nextIndex];
  if (!next) return code;
  const parsed = parseProgram(code).program;
  const already = next.check(parsed).ok;
  if (already) return code;
  if (code.includes(next.appendCode.trim())) return code;
  const prefix = code.endsWith("\n") || code.length === 0 ? "" : "\n";
  return `${code}${prefix}${next.appendCode}`;
}

export function checkStep(mission: CodingMission, stepIndex: number, code: string): StepCheck {
  const step = mission.steps[stepIndex];
  if (!step) return { ok: false, message: "This step does not exist." };
  const { program, errors } = parseProgram(code);
  if (errors.length) return { ok: false, message: errors[0] ?? "Fix the code, then try again." };
  return step.check(program);
}
