import {
  GameCrash,
  type DinoFrame,
  type DinoObstacle,
  type GameView,
  type MinerFrame,
  type PlatformCommand,
  type PlatformLevel,
  type PlatformSample,
  type PyHooks,
  type PyValue,
} from "@/lib/python-vm";

export const PLATFORM_LEVELS: PlatformLevel[] = [
  {
    name: "Flat run",
    rows: [
      "............",
      "............",
      "............",
      "............",
      "......F.....",
      "############",
      "############",
    ],
  },
  {
    name: "One gap",
    rows: [
      "............",
      "............",
      "............",
      "............",
      ".........F..",
      "####..######",
      "####..######",
    ],
  },
  {
    name: "Two gaps",
    rows: [
      "................",
      "................",
      "................",
      "................",
      ".............F..",
      "###..###..######",
      "###..###..######",
    ],
  },
  {
    name: "Timed jumps",
    rows: [
      "................",
      "................",
      "................",
      "................",
      ".............F..",
      "###..###..######",
      "###..###..######",
    ],
  },
];

type Facing = MinerFrame["facing"];

function cloneRows(rows: string[][]): string[][] {
  return rows.map((row) => [...row]);
}

function emptyGame(kind: GameView["kind"]): GameView {
  return { kind, status: "playing", message: "", frames: [], dino: [], level: null, commands: [], samples: [] };
}

const TILE = 24;
const BODY_W = 16;
const BODY_H = 22;
const SPEED = 160;
const JUMP_V = -330;
const GRAVITY = 1200;

function solidChar(ch: string | undefined): boolean {
  return ch === "#";
}

function overlapsSolid(level: PlatformLevel, x: number, y: number): boolean {
  const left = Math.floor(x / TILE);
  const right = Math.floor((x + BODY_W - 0.01) / TILE);
  const top = Math.floor(y / TILE);
  const bottom = Math.floor((y + BODY_H - 0.01) / TILE);
  for (let row = top; row <= bottom; row += 1) {
    for (let col = left; col <= right; col += 1) {
      if (solidChar(level.rows[row]?.[col])) return true;
    }
  }
  return false;
}

function findFlag(level: PlatformLevel): { col: number; row: number } {
  for (let row = 0; row < level.rows.length; row += 1) {
    const col = level.rows[row]!.indexOf("F");
    if (col >= 0) return { col, row };
  }
  return { col: 1, row: 1 };
}

function spawnOf(level: PlatformLevel): { x: number; y: number } {
  const groundRow = level.rows.findIndex((row) => row.includes("#"));
  const y = groundRow * TILE - BODY_H;
  return { x: 4, y };
}

export function playbackPlatformer(level: PlatformLevel, commands: PlatformCommand[]): { status: GameView["status"]; message: string; samples: PlatformSample[] } {
  const spawn = spawnOf(level);
  let x = spawn.x;
  let y = spawn.y;
  let vx = 0;
  let vy = 0;
  let grounded = true;
  const queue = [...commands];
  let runLeft = 0;
  let waitLeft = 0;
  let mode: "idle" | "run" | "wait" | "jump" = "idle";
  const samples: PlatformSample[] = [{ x, y, crashed: false }];
  let status: GameView["status"] = "playing";
  let message = "";
  const flag = findFlag(level);
  const dt = 1 / 60;

  const startNext = () => {
    if (mode !== "idle" || status !== "playing") return;
    const command = queue.shift();
    if (!command) {
      vx = grounded ? 0 : vx;
      return;
    }
    if (command.op === "run") {
      mode = "run";
      runLeft = command.steps * TILE;
      vx = SPEED;
      return;
    }
    if (command.op === "jump") {
      if (!grounded) {
        status = "crash";
        message = "You can only jump from the ground. Wait until you land.";
        return;
      }
      vy = JUMP_V;
      vx = SPEED;
      grounded = false;
      mode = "jump";
      return;
    }
    mode = "wait";
    waitLeft = command.seconds;
  };

  for (let tick = 0; tick < 60 * 12 && status === "playing"; tick += 1) {
    startNext();
    if (status !== "playing") break;
    vy += GRAVITY * dt;
    const nextY = y + vy * dt;
    if (vy > 0 && overlapsSolid(level, x, nextY)) {
      grounded = true;
      vy = 0;
    } else {
      y = nextY;
      grounded = vy >= 0 && overlapsSolid(level, x, y + 1);
    }
    if (mode === "jump") {
      vx = SPEED;
      const nextX = x + vx * dt;
      if (!overlapsSolid(level, nextX, y)) x = nextX;
      else vx = 0;
      if (grounded) {
        mode = "idle";
        vx = 0;
      }
    }
    if (mode === "wait") {
      waitLeft -= dt;
      if (grounded) vx = 0;
      if (waitLeft <= 0) mode = "idle";
    }
    if (mode === "run") {
      if (!grounded) vx = SPEED;
      const nextX = x + vx * dt;
      if (overlapsSolid(level, nextX, y)) {
        vx = 0;
        runLeft = 0;
        mode = "idle";
      } else {
        const moved = Math.abs(nextX - x);
        x = nextX;
        runLeft -= moved;
        if (runLeft <= 0) {
          vx = 0;
          mode = "idle";
        }
      }
    } else if (mode === "idle") {
      const nextX = x + vx * dt;
      if (!overlapsSolid(level, nextX, y)) x = nextX;
      else vx = 0;
      if (grounded) vx = 0;
    }
    if (y > level.rows.length * TILE) {
      status = "crash";
      message = "The avatar fell. Change the jumps and try again.";
      samples.push({ x, y, crashed: true });
      break;
    }
    const flagX = flag.col * TILE;
    const flagY = flag.row * TILE;
    const reached = x < flagX + TILE && x + BODY_W > flagX && y < flagY + TILE && y + BODY_H > flagY;
    if (reached && grounded) {
      status = "win";
      message = "The avatar reached the flag!";
    }
    samples.push({ x, y, crashed: status === "crash" });
  }
  if (status === "playing") {
    status = "crash";
    message = "The avatar did not reach the flag.";
  }
  return { status, message, samples };
}

function numberArg(value: PyValue | undefined, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) throw new GameCrash(`${label} needs a number.`);
  return value;
}

export function platformerHooks(level: number): PyHooks {
  const map = PLATFORM_LEVELS[level - 1];
  if (!map) throw new GameCrash("That platformer level is missing.");
  const view = emptyGame("platformer");
  view.level = map;
  const hooks: PyHooks = {
    gameView: view,
    game(name, args) {
      if (name === "run") {
        const steps = numberArg(args[0], "run()");
        if (!Number.isInteger(steps) || steps < 1 || steps > 20) throw new GameCrash("run() needs a whole number from 1 to 20.");
        view.commands.push({ op: "run", steps });
        return null;
      }
      if (name === "jump") {
        view.commands.push({ op: "jump" });
        return null;
      }
      if (name === "wait") {
        const seconds = numberArg(args[0], "wait()");
        if (seconds <= 0 || seconds > 3) throw new GameCrash("wait() needs seconds between 0 and 3.");
        view.commands.push({ op: "wait", seconds });
        return null;
      }
      throw new GameCrash(`${name}() is not a platformer command.`);
    },
    finish() {
      const played = playbackPlatformer(map, view.commands);
      view.status = played.status;
      view.message = played.message;
      view.samples = played.samples;
    },
  };
  return hooks;
}

export const FLAPPY_LEVELS = [
  ["...G", "...G", "P.#.", "...G"],
  [".....G", ".....G", "P..#..", ".....G"],
  ["....G", "....G", "...#.", "P.#.G"],
  ["......G.", "......G.", "P..#....", "........"],
] as const;

export const CHECKERS_LEVELS = [
  ["+.+G", ".+.+", "+r+."],
  ["+.+G", ".+b+", "+r+."],
  ["+.+G", ".+.+", "+.+.", "r+.+"],
  ["+.+.+", ".+.+G", "+.+.+", ".+b+.", "+.+.+", "r+.+."],
] as const;

export const OTHELLO_LEVELS = [
  [".W.", "PBW", ".W."],
  ["W...", ".B..", "..B.", "P..."],
  ["W...", ".B..", "..B.", "P..."],
  ["PBW.", "....", ".BW.", "...."],
] as const;

export const BOWLING_LEVELS = [
  ["#X.X#", "#.X.#", "#...#", "#.P.#", "#####"],
  ["###X#", "#...#", "#...#", "#.P.#", "#####"],
  ["#XXX#", "#...#", "#...#", "#.P.#", "#####"],
  ["###X#", "##..#", "##P.#", "#####"],
] as const;

type GridState = {
  rows: string[][];
  x: number;
  y: number;
  facing: Facing;
  status: GameView["status"];
  message: string;
};

function gridFrame(state: GridState): MinerFrame {
  return { rows: cloneRows(state.rows), x: state.x, y: state.y, facing: state.facing, dirt: 0, stone: 0, diamond: 0 };
}

function findStart(rows: string[][], mark: string): { x: number; y: number } {
  for (let y = 0; y < rows.length; y += 1) {
    const x = rows[y]!.indexOf(mark);
    if (x >= 0) {
      rows[y]![x] = ".";
      return { x, y };
    }
  }
  return { x: 1, y: 1 };
}

function makeGrid(pattern: readonly string[] | undefined, missing: string, mark = "P"): GridState {
  if (!pattern) throw new GameCrash(missing);
  const rows = pattern.map((row) => row.split(""));
  const start = findStart(rows, mark);
  return { rows, x: start.x, y: start.y, facing: "right", status: "playing", message: "" };
}

function flappyCell(ch: string | undefined): "pipe" | "air" | "goal" {
  if (ch === "G") return "goal";
  if (ch === "." || ch === "P") return "air";
  return "pipe";
}

function closestOpen(state: GridState, x: number): number {
  const open: number[] = [];
  state.rows.forEach((row, y) => {
    const name = flappyCell(row[x]);
    if (name === "air" || name === "goal") open.push(y);
  });
  if (!open.length) return state.y;
  open.sort((a, b) => Math.abs(a - state.y) - Math.abs(b - state.y) || a - b);
  return open[0]!;
}

function gapAhead(state: GridState): number {
  const width = state.rows[0]?.length ?? 0;
  for (let x = state.x + 1; x < width; x += 1) {
    const column = state.rows.map((row) => row[x]);
    if (column.some((cell) => cell === "#")) return closestOpen(state, x);
    const goal = column.findIndex((cell) => cell === "G");
    if (goal >= 0) return goal;
  }
  return state.y;
}

function flappyAct(state: GridState, name: string): PyValue {
  if (state.status === "win") {
    if (name === "ahead") return "goal";
    if (name === "row" || name === "gap_ahead") return state.y;
    return null;
  }
  if (state.status !== "playing") throw new GameCrash(state.message || "The flight is already over.");
  if (name === "row") return state.y;
  if (name === "gap_ahead") return gapAhead(state);
  if (name === "ahead") return flappyCell(state.rows[state.y]?.[state.x + 1]);
  const dy = name === "flap" ? -1 : name === "coast" || name === "glide" ? 0 : null;
  if (dy === null) throw new GameCrash(`${name}() is not a flappy command.`);
  const nx = state.x + 1;
  const ny = state.y + dy;
  const ch = state.rows[ny]?.[nx];
  if (ch === undefined) throw new GameCrash("You flew off the screen.");
  if (ch === "#") throw new GameCrash("You hit a pipe.");
  state.x = nx;
  state.y = ny;
  if (ch === "G") {
    state.status = "win";
    state.message = "You made it through the pipes!";
  }
  return null;
}

function checkersName(ch: string | undefined): string {
  if (ch === "b") return "black";
  if (ch === "G") return "goal";
  if (ch === "." || ch === "r" || ch === "P") return "empty";
  if (ch === "+") return "light";
  return "edge";
}

function checkersWin(state: GridState) {
  state.status = "win";
  state.message = "Your piece reached the yellow square.";
}

function checkersLook(state: GridState, dx: number): string {
  if (state.status === "win") return "goal";
  return checkersName(state.rows[state.y - 1]?.[state.x + dx]);
}

function checkersSlide(state: GridState, dx: number) {
  const nx = state.x + dx;
  const ny = state.y - 1;
  const name = checkersName(state.rows[ny]?.[nx]);
  if (name === "black") throw new GameCrash("A black piece is there. jump_left() or jump_right() hops over it.");
  if (name === "light") throw new GameCrash("Checkers stays on the dark squares.");
  if (name !== "empty" && name !== "goal") throw new GameCrash("That move leaves the board.");
  state.x = nx;
  state.y = ny;
  if (name === "goal") checkersWin(state);
}

function checkersJump(state: GridState, dx: number) {
  const midX = state.x + dx;
  const midY = state.y - 1;
  const landX = state.x + dx * 2;
  const landY = state.y - 2;
  if (state.rows[midY]?.[midX] !== "b") throw new GameCrash("Jump only when a black piece is on the next diagonal square.");
  const name = checkersName(state.rows[landY]?.[landX]);
  if (name !== "empty" && name !== "goal") throw new GameCrash("The landing square is not open.");
  state.rows[midY]![midX] = ".";
  state.x = landX;
  state.y = landY;
  state.message = "You captured a black piece.";
  if (name === "goal") checkersWin(state);
}

function checkersAct(state: GridState, name: string): PyValue {
  if (state.status === "win") return name === "look_left" || name === "look_right" ? "goal" : null;
  if (state.status !== "playing") throw new GameCrash(state.message || "The game is already over.");
  if (name === "look_left") return checkersLook(state, -1);
  if (name === "look_right") return checkersLook(state, 1);
  if (name === "move_left") { checkersSlide(state, -1); return null; }
  if (name === "move_right") { checkersSlide(state, 1); return null; }
  if (name === "jump_left") { checkersJump(state, -1); return null; }
  if (name === "jump_right") { checkersJump(state, 1); return null; }
  throw new GameCrash(`${name}() is not a checkers command.`);
}

const OTHELLO_DIRS = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1],
] as const;

function othelloFlips(state: GridState, x: number, y: number): { x: number; y: number }[] {
  if (state.rows[y]?.[x] !== ".") return [];
  const found: { x: number; y: number }[] = [];
  for (const [dx, dy] of OTHELLO_DIRS) {
    const line: { x: number; y: number }[] = [];
    let cx = x + dx;
    let cy = y + dy;
    while (state.rows[cy]?.[cx] === "B") {
      line.push({ x: cx, y: cy });
      cx += dx;
      cy += dy;
    }
    if (line.length && state.rows[cy]?.[cx] === "W") found.push(...line);
  }
  return found;
}

function othelloBlacks(state: GridState): number {
  return state.rows.flat().filter((cell) => cell === "B").length;
}

function othelloSquare(state: GridState): string {
  const ch = state.rows[state.y]?.[state.x];
  if (ch === undefined) return "edge";
  if (ch === "W") return "white";
  if (ch === "B") return "black";
  return "empty";
}

function othelloAct(state: GridState, name: string): PyValue {
  if (state.status === "win") {
    if (name === "can_play") return "no";
    if (name === "square") return othelloSquare(state);
    return null;
  }
  if (state.status !== "playing") throw new GameCrash(state.message || "The game is already over.");
  if (name === "square") return othelloSquare(state);
  if (name === "can_play") return othelloFlips(state, state.x, state.y).length ? "yes" : "no";
  if (name === "move_up" || name === "move_down" || name === "move_left" || name === "move_right") {
    const dx = name === "move_left" ? -1 : name === "move_right" ? 1 : 0;
    const dy = name === "move_up" ? -1 : name === "move_down" ? 1 : 0;
    const nx = state.x + dx;
    const ny = state.y + dy;
    if (state.rows[ny]?.[nx] === undefined) throw new GameCrash("The cursor left the board.");
    state.x = nx;
    state.y = ny;
    state.facing = name.slice(5) as Facing;
    return null;
  }
  if (name === "play") {
    const flips = othelloFlips(state, state.x, state.y);
    if (!flips.length) throw new GameCrash("That square does not flip a black disc.");
    state.rows[state.y]![state.x] = "W";
    for (const disc of flips) state.rows[disc.y]![disc.x] = "W";
    state.message = flips.length === 1 ? "One disc flipped." : `${flips.length} discs flipped.`;
    if (othelloBlacks(state) === 0) {
      state.status = "win";
      state.message = "Every black disc flipped to white.";
    }
    return null;
  }
  throw new GameCrash(`${name}() is not an othello command.`);
}

function bowlingPins(state: GridState): number {
  return state.rows.flat().filter((cell) => cell === "X").length;
}

function bowlingKnock(state: GridState, x: number, y: number) {
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (state.rows[y + dy]?.[x + dx] === "X") state.rows[y + dy]![x + dx] = ".";
    }
  }
  if (bowlingPins(state) === 0) {
    state.status = "win";
    state.message = "Strike! Every pin is down.";
  }
}

function bowlingAct(state: GridState, name: string): PyValue {
  if (state.status === "win") return name === "pins_ahead" ? "end" : null;
  if (state.status !== "playing") throw new GameCrash(state.message || "The frame is already over.");
  if (name === "pins_ahead") {
    const ch = state.rows[state.y - 1]?.[state.x];
    if (ch === undefined) return "end";
    if (ch === "#") return "gutter";
    if (ch === "X") return "pin";
    return "lane";
  }
  if (name === "aim_left" || name === "aim_right") {
    const nx = state.x + (name === "aim_left" ? -1 : 1);
    const ch = state.rows[state.y]?.[nx];
    if (ch === "#") throw new GameCrash("That way is the gutter.");
    if (ch !== "." && ch !== "X") throw new GameCrash("You cannot aim off the lane.");
    state.x = nx;
    state.facing = name === "aim_left" ? "left" : "right";
    if (ch === "X") bowlingKnock(state, nx, state.y);
    return null;
  }
  if (name === "roll") {
    const ny = state.y - 1;
    const ch = state.rows[ny]?.[state.x];
    if (ch === undefined) throw new GameCrash("The ball rolled past the pins.");
    if (ch === "#") throw new GameCrash("The ball rolled into the gutter.");
    if (ch !== "." && ch !== "X") throw new GameCrash("The ball left the lane.");
    state.y = ny;
    state.facing = "up";
    if (ch === "X") bowlingKnock(state, state.x, ny);
    return null;
  }
  throw new GameCrash(`${name}() is not a bowling command.`);
}

function gridHooks(kind: "flappy" | "checkers" | "othello" | "bowling", act: (state: GridState, name: string) => PyValue, pattern: readonly string[] | undefined, missing: string, mark = "P"): PyHooks {
  const state = makeGrid(pattern, missing, mark);
  const view = emptyGame(kind);
  view.frames.push(gridFrame(state));
  const draw = new Set(["flap", "coast", "glide", "move_up", "move_down", "move_left", "move_right", "jump_left", "jump_right", "play", "aim_left", "aim_right", "roll"]);
  return {
    gameView: view,
    game(name, _args) {
      try {
        const value = act(state, name);
        if (draw.has(name) || state.status !== "playing") view.frames.push(gridFrame(state));
        view.status = state.status;
        view.message = state.message;
        if (state.status === "crash") throw new GameCrash(state.message);
        return value;
      } catch (err) {
        if (view.status !== "crash") {
          view.status = "crash";
          view.message = err instanceof Error ? err.message : "The run crashed.";
          view.frames.push(gridFrame(state));
        }
        throw err;
      }
    },
  };
}

export function flappyHooks(level: number): PyHooks {
  return gridHooks("flappy", flappyAct, FLAPPY_LEVELS[level - 1], "That flappy level is missing.");
}

export function checkersHooks(level: number): PyHooks {
  return gridHooks("checkers", checkersAct, CHECKERS_LEVELS[level - 1], "That checkers level is missing.", "r");
}

export function othelloHooks(level: number): PyHooks {
  return gridHooks("othello", othelloAct, OTHELLO_LEVELS[level - 1], "That othello level is missing.");
}

export function bowlingHooks(level: number): PyHooks {
  return gridHooks("bowling", bowlingAct, BOWLING_LEVELS[level - 1], "That bowling level is missing.");
}

const DINO_LEVELS = ["PCG", "PBG", "PCB.CBG", "PC.B.CG"] as const;

type DinoState = {
  cells: string[];
  x: number;
  obstacles: DinoObstacle[];
  status: GameView["status"];
  message: string;
};

function dinoShot(state: DinoState, x: number, lift: number, crouch: number, leg: number): DinoFrame {
  return { x, lift, crouch, leg, obstacles: state.obstacles.map((item) => ({ ...item })) };
}

function loadDino(pattern: string | undefined): DinoState {
  if (!pattern) throw new GameCrash("That dino level is missing.");
  const cells = pattern.split("");
  let x = 0;
  const obstacles: DinoObstacle[] = [];
  cells.forEach((cell, index) => {
    if (cell === "P") {
      x = index;
      cells[index] = ".";
    } else if (cell === "C") obstacles.push({ x: index, kind: "cactus" });
    else if (cell === "B") obstacles.push({ x: index, kind: "bird" });
    else if (cell === "G") obstacles.push({ x: index, kind: "goal" });
  });
  return { cells, x, obstacles, status: "playing", message: "" };
}

function dinoSpot(state: DinoState): string {
  const next = state.cells[state.x + 1];
  if (next === undefined) return "edge";
  if (next === "C") return "cactus";
  if (next === "B") return "bird";
  if (next === "G") return "goal";
  return "clear";
}

function dinoAct(state: DinoState, name: string): PyValue {
  if (state.status === "win") return name === "ahead" ? "goal" : null;
  if (state.status !== "playing") throw new GameCrash(state.message || "The run is already over.");
  if (name === "ahead") return dinoSpot(state);
  if (name !== "run" && name !== "jump" && name !== "duck") throw new GameCrash(`${name}() is not a dino command.`);
  const spot = dinoSpot(state);
  if (spot === "edge") throw new GameCrash("You ran off the trail.");
  if (name === "run" && spot === "cactus") throw new GameCrash("A cactus is in the way. jump() goes over it.");
  if (name === "run" && spot === "bird") throw new GameCrash("A bird is in the way. duck() goes under it.");
  if (name === "jump" && spot === "bird") throw new GameCrash("You jumped into a bird. duck() goes under it.");
  if (name === "duck" && spot === "cactus") throw new GameCrash("You ducked into a cactus. jump() goes over it.");
  state.x += 1;
  if (spot === "goal") {
    state.status = "win";
    state.message = "You reached the finish.";
  }
  return null;
}

export function dinoHooks(level: number): PyHooks {
  const state = loadDino(DINO_LEVELS[level - 1]);
  const view = emptyGame("dino");
  view.dino.push(dinoShot(state, state.x, 0, 0, 0));
  const moving = new Set(["run", "jump", "duck"]);
  return {
    gameView: view,
    game(name) {
      const from = state.x;
      try {
        const value = dinoAct(state, name);
        if (moving.has(name)) {
          const steps = 6;
          for (let i = 1; i <= steps; i += 1) {
            const t = i / steps;
            const lift = name === "jump" ? Math.sin(t * Math.PI) * 1.15 : name === "run" && i % 2 === 0 ? 0.06 : 0;
            view.dino.push(dinoShot(state, from + (state.x - from) * t, lift, name === "duck" ? 1 : 0, i % 2));
          }
        }
        view.status = state.status;
        view.message = state.message;
        return value;
      } catch (err) {
        const message = err instanceof Error ? err.message : "The run crashed.";
        if (state.x === from && (name === "run" || name === "jump" || name === "duck")) state.x = from + 1;
        view.status = "crash";
        view.message = message;
        state.status = "crash";
        state.message = message;
        view.dino.push(dinoShot(state, state.x, name === "jump" ? 0.35 : 0, name === "duck" ? 1 : 0, 0));
        throw err instanceof GameCrash ? err : new GameCrash(message);
      }
    },
  };
}

export function hooksForGame(kind: "checkers" | "othello" | "platformer" | "flappy" | "bowling" | "dino", level: number): PyHooks {
  if (kind === "checkers") return checkersHooks(level);
  if (kind === "othello") return othelloHooks(level);
  if (kind === "platformer") return platformerHooks(level);
  if (kind === "flappy") return flappyHooks(level);
  if (kind === "bowling") return bowlingHooks(level);
  return dinoHooks(level);
}
