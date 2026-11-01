export type PyValue = boolean | number | string | PyValue[] | { __mod: "random" } | null;

export type PyHooks = {
  choice?: (items: PyValue[]) => PyValue;
  randint?: (a: number, b: number) => number;
  game?: (name: string, args: PyValue[]) => PyValue;
  finish?: () => void;
  gameView?: GameView;
};

export class GameCrash extends Error {
  readonly errorKind = "logic" as const;
  constructor(message: string) {
    super(message);
    this.name = "GameCrash";
  }
}

export type GameView = {
  kind: "miner" | "platformer";
  status: "playing" | "win" | "crash";
  message: string;
  frames: MinerFrame[];
  level: PlatformLevel | null;
  commands: PlatformCommand[];
  samples: PlatformSample[];
};

export type MinerFrame = {
  rows: string[][];
  x: number;
  y: number;
  facing: "up" | "down" | "left" | "right";
  dirt: number;
  stone: number;
  diamond: number;
};

export type PlatformCommand = { op: "run"; steps: number } | { op: "jump" } | { op: "wait"; seconds: number };

export type PlatformLevel = {
  name: string;
  rows: string[];
};

export type PlatformSample = { x: number; y: number; crashed: boolean };

export type PyStatus = "done" | "waiting" | "error";

export type PyRun = {
  prints: string[];
  inputs: string[];
  status: PyStatus;
  prompt: string;
  error: string;
  game: GameView | null;
};

type Tok = { type: string; value: string; line: number };

type Expr =
  | { type: "num"; value: number }
  | { type: "str"; value: string }
  | { type: "bool"; value: boolean }
  | { type: "none" }
  | { type: "name"; id: string }
  | { type: "list"; items: Expr[] }
  | { type: "call"; callee: Expr; args: Expr[] }
  | { type: "attr"; object: Expr; name: string }
  | { type: "bin"; op: string; left: Expr; right: Expr }
  | { type: "unary"; op: string; expr: Expr }
  | { type: "join"; parts: Expr[] };

type Branch = { test: Expr | null; body: Stmt[] };
type Stmt =
  | { type: "assign"; name: string; expr: Expr }
  | { type: "expr"; expr: Expr }
  | { type: "if"; branches: Branch[] }
  | { type: "while"; test: Expr; body: Stmt[] }
  | { type: "for"; name: string; iter: Expr; body: Stmt[] }
  | { type: "import"; name: string }
  | { type: "break" }
  | { type: "pass" };

const KEYWORDS = new Set(["if", "elif", "else", "while", "for", "in", "import", "True", "False", "None", "and", "or", "not", "break", "pass"]);
const GAME_FNS = new Set(["move_up", "move_down", "move_left", "move_right", "mine_block", "place_block", "block_ahead", "run", "jump", "wait"]);
const CMP = new Set(["==", "!=", "<", ">", "<=", ">=", "in"]);
const BANNED = new Set(["eval", "exec", "open", "compile", "__import__", "globals", "locals", "exit", "quit"]);

class PyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PyError";
  }
}

class BreakSignal extends Error {
  constructor() {
    super("break");
    this.name = "BreakSignal";
  }
}

export function pyDisplay(value: PyValue): string {
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "object" && !Array.isArray(value) && value.__mod) return "<module>";
  if (Array.isArray(value)) return `[${value.map((item) => (typeof item === "string" ? `"${item}"` : pyDisplay(item))).join(", ")}]`;
  return String(value);
}

export function tokenize(source: string, lineMode = true): Tok[] {
  const tokens: Tok[] = [];
  const indents = [0];
  let i = 0;
  let line = 1;
  const push = (type: string, value = "", at = line) => tokens.push({ type, value, line: at });

  const skipSpaces = () => {
    while (i < source.length && (source[i] === " " || source[i] === "\t")) i += 1;
  };

  while (i < source.length) {
    if (lineMode && (i === 0 || source[i - 1] === "\n")) {
      let indent = 0;
      while (source[i] === " " || source[i] === "\t") {
        indent += source[i] === "\t" ? 4 : 1;
        i += 1;
      }
      if (source[i] === "#" || source[i] === "\n" || i >= source.length) {
        if (source[i] === "#") while (i < source.length && source[i] !== "\n") i += 1;
        if (source[i] === "\n") { i += 1; line += 1; }
        continue;
      }
      if (indent > indents[indents.length - 1]!) {
        indents.push(indent);
        push("INDENT");
      } else {
        while (indent < indents[indents.length - 1]!) {
          indents.pop();
          push("DEDENT");
        }
        if (indent !== indents[indents.length - 1]) throw new PyError(`Line ${line}: indentation does not match.`);
      }
    }

    const ch = source[i];
    if (ch === " " || ch === "\t") { skipSpaces(); continue; }
    if (ch === "#") { while (i < source.length && source[i] !== "\n") i += 1; continue; }
    if (ch === "\n") {
      push("NEWLINE");
      i += 1;
      line += 1;
      continue;
    }
    if (ch === "\r") { i += 1; continue; }

    const startLine = line;
    if ((ch === "f" || ch === "F") && (source[i + 1] === '"' || source[i + 1] === "'")) {
      const quote = source[i + 1]!;
      i += 2;
      let body = "";
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\n") throw new PyError(`Line ${startLine}: string is missing a closing quote.`);
        if (source[i] === "\\") {
          i += 1;
          const esc = source[i];
          body += esc === "n" ? "\n" : esc === "t" ? "\t" : (esc ?? "");
          i += 1;
        } else {
          body += source[i];
          i += 1;
        }
      }
      if (source[i] !== quote) throw new PyError(`Line ${startLine}: string is missing a closing quote.`);
      i += 1;
      push("FSTRING", body, startLine);
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i += 1;
      let body = "";
      while (i < source.length && source[i] !== quote) {
        if (source[i] === "\n") throw new PyError(`Line ${startLine}: string is missing a closing quote.`);
        if (source[i] === "\\") {
          i += 1;
          const esc = source[i];
          body += esc === "n" ? "\n" : esc === "t" ? "\t" : (esc ?? "");
          i += 1;
        } else {
          body += source[i];
          i += 1;
        }
      }
      if (source[i] !== quote) throw new PyError(`Line ${startLine}: string is missing a closing quote.`);
      i += 1;
      push("STRING", body, startLine);
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(source[i + 1] ?? ""))) {
      let n = "";
      while (i < source.length && /[0-9.]/.test(source[i]!)) { n += source[i]; i += 1; }
      push("NUMBER", n, startLine);
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let name = "";
      while (i < source.length && /[A-Za-z0-9_]/.test(source[i]!)) { name += source[i]; i += 1; }
      push("NAME", name, startLine);
      continue;
    }
    const two = source.slice(i, i + 2);
    if (["==", "!=", "<=", ">="].includes(two)) { push("OP", two, startLine); i += 2; continue; }
    if ("=<>+-*/%()[],:.".includes(ch)) { push("OP", ch, startLine); i += 1; continue; }
    throw new PyError(`Line ${line}: I cannot read this character: ${ch}`);
  }
  if (tokens.length && tokens[tokens.length - 1]!.type !== "NEWLINE") push("NEWLINE");
  while (indents.length > 1) { indents.pop(); push("DEDENT"); }
  push("EOF");
  return tokens;
}

function parseFString(raw: string, line: number, parseExpr: (src: string) => Expr): Expr {
  const parts: Expr[] = [];
  let buf = "";
  for (let i = 0; i < raw.length; i += 1) {
    if (raw[i] === "{") {
      if (buf) { parts.push({ type: "str", value: buf }); buf = ""; }
      i += 1;
      const start = i;
      let depth = 1;
      while (i < raw.length && depth > 0) {
        if (raw[i] === "{") depth += 1;
        else if (raw[i] === "}") depth -= 1;
        if (depth > 0) i += 1;
      }
      if (depth !== 0) throw new PyError(`Line ${line}: f-string is missing a closing }.`);
      const inner = raw.slice(start, i).trim();
      if (!inner) throw new PyError(`Line ${line}: empty { } in f-string.`);
      parts.push(parseExpr(inner));
    } else buf += raw[i];
  }
  if (buf) parts.push({ type: "str", value: buf });
  if (parts.length === 1) return parts[0]!;
  return { type: "join", parts };
}

class Parser {
  i = 0;
  constructor(private tokens: Tok[]) {}
  peek() { return this.tokens[this.i] ?? { type: "EOF", value: "", line: 0 }; }
  at(type: string, value?: string) {
    const t = this.peek();
    return t.type === type && (value === undefined || t.value === value);
  }
  eat(type?: string, value?: string) {
    const t = this.peek();
    if (type && t.type !== type) throw new PyError(`Line ${t.line}: expected ${type}.`);
    if (value !== undefined && t.value !== value) throw new PyError(`Line ${t.line}: expected ${value}.`);
    this.i += 1;
    return t;
  }
  skipNewlines() { while (this.at("NEWLINE")) this.eat("NEWLINE"); }
  nameIs(word: string) { return this.at("NAME", word); }

  parseFile(): Stmt[] {
    const body: Stmt[] = [];
    this.skipNewlines();
    while (!this.at("EOF")) {
      body.push(this.parseStmt());
      this.skipNewlines();
    }
    return body;
  }

  parseStmt(): Stmt {
    if (this.nameIs("if")) return this.parseIf();
    if (this.nameIs("while")) return this.parseWhile();
    if (this.nameIs("for")) return this.parseFor();
    if (this.nameIs("import")) {
      this.eat("NAME", "import");
      const name = this.eat("NAME").value;
      this.expectEnd();
      return { type: "import", name };
    }
    if (this.nameIs("break")) { this.eat("NAME", "break"); this.expectEnd(); return { type: "break" }; }
    if (this.nameIs("pass")) { this.eat("NAME", "pass"); this.expectEnd(); return { type: "pass" }; }
    const expr = this.parseOr();
    if (this.at("OP", "=")) {
      if (expr.type !== "name") throw new PyError(`Line ${this.peek().line}: I can only store into a simple name.`);
      this.eat("OP", "=");
      const value = this.parseOr();
      this.expectEnd();
      return { type: "assign", name: expr.id, expr: value };
    }
    this.expectEnd();
    return { type: "expr", expr };
  }

  expectEnd() {
    if (this.at("NEWLINE") || this.at("DEDENT") || this.at("EOF")) {
      if (this.at("NEWLINE")) this.eat("NEWLINE");
      return;
    }
    throw new PyError(`Line ${this.peek().line}: I expected the line to end here.`);
  }

  parseBlock(): Stmt[] {
    if (!this.at("OP", ":")) throw new PyError(`Line ${this.peek().line}: missing : at the end of this line.`);
    this.eat("OP", ":");
    if (!this.at("NEWLINE")) throw new PyError(`Line ${this.peek().line}: start a new indented line after :`);
    this.eat("NEWLINE");
    if (!this.at("INDENT")) throw new PyError(`Line ${this.peek().line}: indent the next line after :`);
    this.eat("INDENT");
    const body: Stmt[] = [];
    this.skipNewlines();
    while (!this.at("DEDENT") && !this.at("EOF")) {
      body.push(this.parseStmt());
      this.skipNewlines();
    }
    if (this.at("DEDENT")) this.eat("DEDENT");
    if (!body.length) throw new PyError("A block needs at least one line of code.");
    return body;
  }

  parseIf(): Stmt {
    const branches: Branch[] = [];
    this.eat("NAME", "if");
    const test = this.parseOr();
    branches.push({ test, body: this.parseBlock() });
    while (this.nameIs("elif")) {
      this.eat("NAME", "elif");
      const elifTest = this.parseOr();
      branches.push({ test: elifTest, body: this.parseBlock() });
    }
    if (this.nameIs("else")) {
      this.eat("NAME", "else");
      branches.push({ test: null, body: this.parseBlock() });
    }
    return { type: "if", branches };
  }

  parseWhile(): Stmt {
    this.eat("NAME", "while");
    const test = this.parseOr();
    return { type: "while", test, body: this.parseBlock() };
  }

  parseFor(): Stmt {
    this.eat("NAME", "for");
    const name = this.eat("NAME").value;
    if (!this.nameIs("in")) throw new PyError(`Line ${this.peek().line}: a for loop needs in.`);
    this.eat("NAME", "in");
    const iter = this.parseOr();
    return { type: "for", name, iter, body: this.parseBlock() };
  }

  parseOr(): Expr {
    let left = this.parseAnd();
    while (this.nameIs("or")) {
      this.eat("NAME", "or");
      left = { type: "bin", op: "or", left, right: this.parseAnd() };
    }
    return left;
  }
  parseAnd(): Expr {
    let left = this.parseNot();
    while (this.nameIs("and")) {
      this.eat("NAME", "and");
      left = { type: "bin", op: "and", left, right: this.parseNot() };
    }
    return left;
  }
  parseNot(): Expr {
    if (this.nameIs("not")) {
      this.eat("NAME", "not");
      return { type: "unary", op: "not", expr: this.parseNot() };
    }
    return this.parseCmp();
  }
  parseCmp(): Expr {
    let left = this.parseAdd();
    const t = this.peek();
    if ((t.type === "OP" && CMP.has(t.value)) || this.nameIs("in")) {
      const op = this.nameIs("in") ? this.eat("NAME", "in").value : this.eat("OP").value;
      left = { type: "bin", op, left, right: this.parseAdd() };
    }
    return left;
  }
  parseAdd(): Expr {
    let left = this.parseMul();
    while (this.at("OP", "+") || this.at("OP", "-")) {
      const op = this.eat("OP").value;
      left = { type: "bin", op, left, right: this.parseMul() };
    }
    return left;
  }
  parseMul(): Expr {
    let left = this.parseUnary();
    while (this.at("OP", "*") || this.at("OP", "/") || this.at("OP", "%")) {
      const op = this.eat("OP").value;
      left = { type: "bin", op, left, right: this.parseUnary() };
    }
    return left;
  }
  parseUnary(): Expr {
    if (this.at("OP", "-") || this.at("OP", "+")) {
      const op = this.eat("OP").value;
      return { type: "unary", op, expr: this.parseUnary() };
    }
    return this.parsePost();
  }
  parsePost(): Expr {
    let expr = this.parseAtom();
    while (true) {
      if (this.at("OP", ".")) {
        this.eat("OP", ".");
        expr = { type: "attr", object: expr, name: this.eat("NAME").value };
      } else if (this.at("OP", "(")) {
        this.eat("OP", "(");
        const args: Expr[] = [];
        if (!this.at("OP", ")")) {
          args.push(this.parseOr());
          while (this.at("OP", ",")) {
            this.eat("OP", ",");
            args.push(this.parseOr());
          }
        }
        this.eat("OP", ")");
        expr = { type: "call", callee: expr, args };
      } else break;
    }
    return expr;
  }
  parseAtom(): Expr {
    const t = this.peek();
    if (t.type === "NUMBER") {
      this.eat("NUMBER");
      return { type: "num", value: Number(t.value) };
    }
    if (t.type === "STRING") { this.eat("STRING"); return { type: "str", value: t.value }; }
    if (t.type === "FSTRING") {
      this.eat("FSTRING");
      return parseFString(t.value, t.line, (src) => parseExpr(src));
    }
    if (this.nameIs("True")) { this.eat("NAME"); return { type: "bool", value: true }; }
    if (this.nameIs("False")) { this.eat("NAME"); return { type: "bool", value: false }; }
    if (this.nameIs("None")) { this.eat("NAME"); return { type: "none" }; }
    if (t.type === "NAME") {
      if (KEYWORDS.has(t.value) && !["True", "False", "None"].includes(t.value)) {
        throw new PyError(`Line ${t.line}: ${t.value} cannot be used here.`);
      }
      this.eat("NAME");
      return { type: "name", id: t.value };
    }
    if (this.at("OP", "(")) {
      this.eat("OP", "(");
      const inner = this.parseOr();
      this.eat("OP", ")");
      return inner;
    }
    if (this.at("OP", "[")) {
      this.eat("OP", "[");
      const items: Expr[] = [];
      if (!this.at("OP", "]")) {
        items.push(this.parseOr());
        while (this.at("OP", ",")) {
          this.eat("OP", ",");
          if (this.at("OP", "]")) break;
          items.push(this.parseOr());
        }
      }
      this.eat("OP", "]");
      return { type: "list", items };
    }
    throw new PyError(`Line ${t.line}: I do not understand this part of the code.`);
  }
}

function parseExpr(src: string): Expr {
  const parser = new Parser(tokenize(src, false));
  const expr = parser.parseOr();
  parser.skipNewlines();
  return expr;
}

export function parsePython(source: string): Stmt[] {
  return new Parser(tokenize(source, true)).parseFile();
}

function truthy(value: PyValue): boolean {
  if (value === null || value === false) return false;
  if (value === 0 || value === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function isInt(value: PyValue): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

type Env = Record<string, PyValue>;

function* evalExpr(expr: Expr, env: Env, ctx: RunCtx): Generator<string, PyValue, string> {
  ctx.steps += 1;
  if (ctx.steps > 8000) throw new PyError("This program ran too long. Check your while loop.");
  switch (expr.type) {
    case "num": return expr.value;
    case "str": return expr.value;
    case "bool": return expr.value;
    case "none": return null;
    case "name": {
      if (!(expr.id in env)) throw new PyError(`I do not know the name ${expr.id}.`);
      return env[expr.id]!;
    }
    case "list": {
      const items: PyValue[] = [];
      for (const item of expr.items) items.push(yield* evalExpr(item, env, ctx));
      return items;
    }
    case "join": {
      let out = "";
      for (const part of expr.parts) out += pyDisplay(yield* evalExpr(part, env, ctx));
      return out;
    }
    case "attr": {
      const obj = yield* evalExpr(expr.object, env, ctx);
      if (obj && typeof obj === "object" && !Array.isArray(obj) && obj.__mod === "random") {
        return { __mod: "random", [expr.name]: true } as unknown as PyValue;
      }
      throw new PyError(`I cannot read .${expr.name} on that value.`);
    }
    case "unary": {
      const v = yield* evalExpr(expr.expr, env, ctx);
      if (expr.op === "not") return !truthy(v);
      if (expr.op === "+") {
        if (typeof v !== "number") throw new PyError("I can only use + on a number here.");
        return v;
      }
      if (typeof v !== "number") throw new PyError("I can only use - on a number.");
      return -v;
    }
    case "bin": {
      if (expr.op === "and") {
        const left = yield* evalExpr(expr.left, env, ctx);
        return truthy(left) ? yield* evalExpr(expr.right, env, ctx) : left;
      }
      if (expr.op === "or") {
        const left = yield* evalExpr(expr.left, env, ctx);
        return truthy(left) ? left : yield* evalExpr(expr.right, env, ctx);
      }
      const left = yield* evalExpr(expr.left, env, ctx);
      const right = yield* evalExpr(expr.right, env, ctx);
      return applyBin(expr.op, left, right);
    }
    case "call":
      return yield* evalCall(expr, env, ctx);
    default:
      throw new PyError("I cannot run this expression.");
  }
}

function applyBin(op: string, left: PyValue, right: PyValue): PyValue {
  if (op === "in") {
    if (typeof right === "string") return typeof left === "string" && right.includes(left);
    if (Array.isArray(right)) return right.some((item) => item === left);
    throw new PyError("in only works with text or a list.");
  }
  if (op === "==") return left === right;
  if (op === "!=") return left !== right;
  if (op === "<" || op === ">" || op === "<=" || op === ">=") {
    if (typeof left !== "number" || typeof right !== "number") throw new PyError("I can only compare numbers with < >.");
    if (op === "<") return left < right;
    if (op === ">") return left > right;
    if (op === "<=") return left <= right;
    return left >= right;
  }
  if (op === "+" && typeof left === "string" && typeof right === "string") return left + right;
  if (op === "+" && typeof left === "number" && typeof right === "number") return left + right;
  if ((op === "-" || op === "*" || op === "/" || op === "%") && typeof left === "number" && typeof right === "number") {
    if ((op === "/" || op === "%") && right === 0) throw new PyError("I cannot divide by zero.");
    if (op === "-") return left - right;
    if (op === "*") return left * right;
    if (op === "/") return left / right;
    return left % right;
  }
  throw new PyError(`I cannot use ${op} on those values.`);
}

type RunCtx = { prints: string[]; steps: number; loops: number; hooks: PyHooks };

function* evalCall(expr: Extract<Expr, { type: "call" }>, env: Env, ctx: RunCtx): Generator<string, PyValue, string> {
  if (expr.callee.type === "name") {
    const name = expr.callee.id;
    if (BANNED.has(name) || name.startsWith("__")) throw new PyError(`${name} is not allowed in this playground.`);
    const args: PyValue[] = [];
    for (const arg of expr.args) args.push(yield* evalExpr(arg, env, ctx));
    if (name === "print") {
      ctx.prints.push(args.map((arg) => (typeof arg === "string" ? arg : pyDisplay(arg))).join(" "));
      return null;
    }
    if (name === "input") {
      const prompt = args.length ? pyDisplay(args[0]!) : "";
      const answer = yield prompt;
      return answer;
    }
    if (name === "int") {
      const n = Number.parseInt(String(args[0] ?? ""), 10);
      if (Number.isNaN(n)) throw new PyError("int() needs a whole number.");
      return n;
    }
    if (name === "str") return pyDisplay(args[0] ?? null);
    if (name === "len") {
      const v = args[0];
      if (typeof v === "string" || Array.isArray(v)) return v.length;
      throw new PyError("len() needs text or a list.");
    }
    if (GAME_FNS.has(name)) {
      if (!ctx.hooks.game) throw new PyError(`${name}() works in the miner and platformer missions.`);
      return ctx.hooks.game(name, args);
    }
    throw new PyError(`I do not know the function ${name}.`);
  }
  if (expr.callee.type === "attr" && expr.callee.object.type === "name" && expr.callee.object.id === "random") {
    if (!("random" in env)) throw new PyError("Import random first: import random");
    const args: PyValue[] = [];
    for (const arg of expr.args) args.push(yield* evalExpr(arg, env, ctx));
    if (expr.callee.name === "choice") {
      const list = args[0];
      if (!Array.isArray(list) || list.length === 0) throw new PyError("random.choice needs a list with items.");
      return ctx.hooks.choice ? ctx.hooks.choice(list) : list[Math.floor(Math.random() * list.length)]!;
    }
    if (expr.callee.name === "randint") {
      const a = args[0];
      const b = args[1];
      if (!isInt(a) || !isInt(b)) throw new PyError("random.randint needs two whole numbers.");
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return ctx.hooks.randint ? ctx.hooks.randint(a, b) : lo + Math.floor(Math.random() * (hi - lo + 1));
    }
    throw new PyError(`random.${expr.callee.name} is not available here.`);
  }
  throw new PyError("I can only call functions like print, input, int, and random.choice.");
}

function* evalBlock(body: Stmt[], env: Env, ctx: RunCtx): Generator<string, void, string> {
  for (const stmt of body) yield* evalStmt(stmt, env, ctx);
}

function* evalStmt(stmt: Stmt, env: Env, ctx: RunCtx): Generator<string, void, string> {
  ctx.steps += 1;
  if (ctx.steps > 8000) throw new PyError("This program ran too long. Check your while loop.");
  switch (stmt.type) {
    case "pass":
      return;
    case "break":
      throw new BreakSignal();
    case "assign": {
      if (BANNED.has(stmt.name) || stmt.name.startsWith("__")) throw new PyError("That name is not allowed.");
      env[stmt.name] = yield* evalExpr(stmt.expr, env, ctx);
      return;
    }
    case "expr":
      yield* evalExpr(stmt.expr, env, ctx);
      return;
    case "import": {
      if (stmt.name !== "random") throw new PyError("This playground only allows: import random");
      env.random = { __mod: "random" };
      return;
    }
    case "if": {
      for (const branch of stmt.branches) {
        const ok = branch.test === null ? true : truthy(yield* evalExpr(branch.test, env, ctx));
        if (ok) {
          yield* evalBlock(branch.body, env, ctx);
          return;
        }
      }
      return;
    }
    case "while": {
      while (truthy(yield* evalExpr(stmt.test, env, ctx))) {
        ctx.loops += 1;
        if (ctx.loops > 400) throw new PyError("The while loop ran too many times. Did you forget to change the guess?");
        try {
          yield* evalBlock(stmt.body, env, ctx);
        } catch (err) {
          if (err instanceof BreakSignal) return;
          throw err;
        }
      }
      return;
    }
    case "for": {
      const iter = yield* evalExpr(stmt.iter, env, ctx);
      const items = typeof iter === "string" ? [...iter] : Array.isArray(iter) ? iter : null;
      if (!items) throw new PyError("I can only loop over text or a list.");
      for (const item of items) {
        env[stmt.name] = item;
        try {
          yield* evalBlock(stmt.body, env, ctx);
        } catch (err) {
          if (err instanceof BreakSignal) return;
          throw err;
        }
      }
      return;
    }
  }
}

export class PySession {
  prints: string[] = [];
  inputs: string[] = [];
  status: PyStatus = "done";
  prompt = "";
  error = "";
  errorKind: "syntax" | "logic" = "syntax";
  game: GameView | null = null;
  private gen: Generator<string, void, string> | null = null;
  private hooks: PyHooks;

  constructor(code: string, hooks: PyHooks = {}) {
    this.hooks = hooks;
    this.game = hooks.gameView ?? null;
    try {
      const ast = parsePython(code);
      const ctx: RunCtx = { prints: this.prints, steps: 0, loops: 0, hooks };
      const env: Env = {};
      this.gen = (function* () { yield* evalBlock(ast, env, ctx); })();
      this.advance();
    } catch (err) {
      this.fail(err);
    }
  }

  provideInput(value: string) {
    if (this.status !== "waiting" || !this.gen) return;
    this.inputs.push(value);
    this.advance(value);
  }

  private advance(answer?: string) {
    if (!this.gen) return;
    try {
      const result = answer === undefined ? this.gen.next() : this.gen.next(answer);
      if (result.done) {
        this.status = "done";
        this.prompt = "";
        try {
          this.hooks.finish?.();
        } catch (err) {
          this.fail(err);
        }
        return;
      }
      this.status = "waiting";
      this.prompt = result.value;
    } catch (err) {
      this.fail(err);
    }
  }

  private fail(err: unknown) {
    this.status = "error";
    this.error = err instanceof Error ? err.message : "Something went wrong.";
    this.errorKind = err instanceof GameCrash ? "logic" : "syntax";
    this.gen = null;
  }
}

export function runPython(code: string, inputs: string[] = [], hooks: PyHooks = {}): PyRun {
  const session = new PySession(code, hooks);
  for (const value of inputs) {
    if (session.status !== "waiting") break;
    session.provideInput(value);
  }
  return {
    prints: [...session.prints],
    inputs: [...session.inputs],
    status: session.status,
    prompt: session.prompt,
    error: session.error,
    game: session.game,
  };
}
