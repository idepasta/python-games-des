import {
  GameCrash,
  type GameView,
  type MinerFrame,
  type PlatformCommand,
  type PlatformLevel,
  type PlatformSample,
  type PyHooks,
  type PyValue,
} from "@/lib/python-vm";

export const MINER_LEVELS = [
  ["#####", "#P.G#", "#####"],
  ["######", "#P.DG#", "######"],
  ["#######", "#PDDDG#", "#######"],
  ["#######", "#PDS*G#", "#######"],
  ["######", "#P.Db#", "#...G#", "######"],
] as const;

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

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
} as const;

type Facing = MinerFrame["facing"];
type MinerState = {
  rows: string[][];
  x: number;
  y: number;
  facing: Facing;
  dirt: number;
  stone: number;
  diamond: number;
  status: GameView["status"];
  message: string;
};

function cloneRows(rows: string[][]): string[][] {
  return rows.map((row) => [...row]);
}

function frameOf(state: MinerState): MinerFrame {
  return {
    rows: cloneRows(state.rows),
    x: state.x,
    y: state.y,
    facing: state.facing,
    dirt: state.dirt,
    stone: state.stone,
    diamond: state.diamond,
  };
}

function cellName(ch: string): string {
  if (ch === "." || ch === "P") return "air";
  if (ch === "D") return "dirt";
  if (ch === "S") return "stone";
  if (ch === "*") return "diamond";
  if (ch === "G") return "goal";
  if (ch === "b") return "mark";
  if (ch === "=") return "plank";
  return "wall";
}

function emptyGame(kind: GameView["kind"]): GameView {
  return { kind, status: "playing", message: "", frames: [], level: null, commands: [], samples: [] };
}

export function createMiner(level: number): MinerState {
  const pattern = MINER_LEVELS[level - 1];
  if (!pattern) throw new GameCrash("That miner level is missing.");
  const rows = pattern.map((row) => row.split(""));
  let x = 1;
  let y = 1;
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, col) => {
      if (cell === "P") {
        x = col;
        y = rowIndex;
        row[col] = ".";
      }
    });
  });
  return { rows, x, y, facing: "right", dirt: 0, stone: 0, diamond: 0, status: "playing", message: "" };
}

function aheadCell(state: MinerState): { x: number; y: number; name: string } {
  const dir = DIRS[state.facing];
  const x = state.x + dir.x;
  const y = state.y + dir.y;
  const ch = state.rows[y]?.[x] ?? "#";
  return { x, y, name: cellName(ch) };
}

function marksLeft(state: MinerState): number {
  return state.rows.flat().filter((cell) => cell === "b").length;
}

function finishIfWon(state: MinerState) {
  const here = state.rows[state.y]?.[state.x];
  if (here === "G" && marksLeft(state) === 0) {
    state.status = "win";
    state.message = "You cleared the mine!";
  } else if (here === "G") {
    state.status = "crash";
    state.message = "The blueprint still needs planks.";
  }
}

function minerAct(state: MinerState, name: string, args: PyValue[]): PyValue {
  if (state.status !== "playing") throw new GameCrash(state.message || "The level is already over.");
  if (name === "block_ahead") return aheadCell(state).name;
  if (name === "move_up" || name === "move_down" || name === "move_left" || name === "move_right") {
    const facing = name.slice(5) as Facing;
    state.facing = facing;
    const next = aheadCell(state);
    const walkable = next.name === "air" || next.name === "goal" || next.name === "plank" || next.name === "mark";
    if (!walkable) throw new GameCrash(`You bumped into ${next.name}. Mine it or go around it.`);
    state.x = next.x;
    state.y = next.y;
    finishIfWon(state);
    return null;
  }
  if (name === "mine_block") {
    const next = aheadCell(state);
    if (next.name !== "dirt" && next.name !== "stone" && next.name !== "diamond") {
      throw new GameCrash(next.name === "air" ? "There is nothing to mine." : `You cannot mine ${next.name}.`);
    }
    if (next.name === "dirt") state.dirt += 1;
    if (next.name === "stone") state.stone += 1;
    if (next.name === "diamond") state.diamond += 1;
    state.rows[next.y]![next.x] = ".";
    state.message = next.name === "diamond" ? "You found a diamond!" : `You mined ${next.name}.`;
    return null;
  }
  if (name === "place_block") {
    const kind = args[0];
    if (kind !== "plank") throw new GameCrash('place_block("plank") builds on a yellow mark.');
    if (state.dirt < 1) throw new GameCrash("Mine dirt first. One dirt makes one plank.");
    const next = aheadCell(state);
    if (next.name !== "mark") throw new GameCrash("Face a yellow blueprint mark, then place a plank.");
    state.dirt -= 1;
    state.rows[next.y]![next.x] = "=";
    state.message = "You placed a plank.";
    return null;
  }
  throw new GameCrash(`${name}() is not a miner command.`);
}

export function minerHooks(level: number): PyHooks {
  const state = createMiner(level);
  const view = emptyGame("miner");
  view.frames.push(frameOf(state));
  const hooks: PyHooks = {
    gameView: view,
    game(name, args) {
      try {
        const value = minerAct(state, name, args);
        view.frames.push(frameOf(state));
        view.status = state.status;
        view.message = state.message;
        if (state.status === "crash") throw new GameCrash(state.message);
        return value;
      } catch (err) {
        if (view.status !== "crash") {
          view.status = "crash";
          view.message = err instanceof Error ? err.message : "The miner crashed.";
          view.frames.push(frameOf(state));
        }
        throw err;
      }
    },
  };
  return hooks;
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

export function hooksForGame(kind: "miner" | "platformer", level: number): PyHooks {
  return kind === "miner" ? minerHooks(level) : platformerHooks(level);
}
