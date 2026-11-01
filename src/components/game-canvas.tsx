import { useEffect, useRef, useState } from "react";
import type { DinoFrame, GameView, MinerFrame, PlatformLevel, PlatformSample } from "@/lib/python-vm";

function boardMetrics(frame: MinerFrame, width: number, height: number) {
  const rows = frame.rows.length;
  const cols = frame.rows[0]?.length ?? 1;
  const cell = Math.min((width - 16) / cols, (height - 28) / rows);
  return { rows, cols, cell, ox: (width - cell * cols) / 2, oy: 8 };
}

function fillDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCheckers(ctx: CanvasRenderingContext2D, frame: MinerFrame, width: number, height: number) {
  ctx.fillStyle = "#3f2a1d";
  ctx.fillRect(0, 0, width, height);
  const { cell, ox, oy } = boardMetrics(frame, width, height);
  frame.rows.forEach((row, y) => {
    row.forEach((square, x) => {
      const px = ox + x * cell;
      const py = oy + y * cell;
      ctx.fillStyle = square === "+" ? "#f3d7a1" : "#8b5a2b";
      ctx.fillRect(px, py, cell - 1, cell - 1);
      const cx = px + cell / 2;
      const cy = py + cell / 2;
      const radius = cell * 0.28;
      if (square === "b") fillDisc(ctx, cx, cy, radius, "#111827");
      if (square === "G") {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  });
  const cx = ox + frame.x * cell + cell / 2;
  const cy = oy + frame.y * cell + cell / 2;
  fillDisc(ctx, cx, cy, cell * 0.28, "#dc2626");
  ctx.fillStyle = "#f8fafc";
  ctx.font = "11px sans-serif";
  ctx.fillText("Red moves diagonally toward the top.", 8, height - 8);
}

function drawOthello(ctx: CanvasRenderingContext2D, frame: MinerFrame, width: number, height: number) {
  ctx.fillStyle = "#14532d";
  ctx.fillRect(0, 0, width, height);
  const { cell, ox, oy } = boardMetrics(frame, width, height);
  frame.rows.forEach((row, y) => {
    row.forEach((square, x) => {
      const px = ox + x * cell;
      const py = oy + y * cell;
      ctx.fillStyle = "#166534";
      ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
      const cx = px + cell / 2;
      const cy = py + cell / 2;
      if (square === "W") fillDisc(ctx, cx, cy, cell * 0.32, "#f8fafc");
      if (square === "B") fillDisc(ctx, cx, cy, cell * 0.32, "#0f172a");
    });
  });
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 3;
  ctx.strokeRect(ox + frame.x * cell + 2, oy + frame.y * cell + 2, cell - 5, cell - 5);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "11px sans-serif";
  ctx.fillText("White to play. Flip every black disc.", 8, height - 8);
}

function drawBowling(ctx: CanvasRenderingContext2D, frame: MinerFrame, width: number, height: number) {
  ctx.fillStyle = "#44403c";
  ctx.fillRect(0, 0, width, height);
  const { cell, ox, oy } = boardMetrics(frame, width, height);
  frame.rows.forEach((row, y) => {
    row.forEach((square, x) => {
      const px = ox + x * cell;
      const py = oy + y * cell;
      ctx.fillStyle = square === "#" ? "#1c1917" : "#d6b48a";
      ctx.fillRect(px, py, cell - 1, cell - 1);
      if (square === "X") {
        fillDisc(ctx, px + cell / 2, py + cell / 2, cell * 0.22, "#f8fafc");
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(px + cell * 0.38, py + cell * 0.42, cell * 0.24, cell * 0.08);
      }
    });
  });
  fillDisc(ctx, ox + frame.x * cell + cell / 2, oy + frame.y * cell + cell / 2, cell * 0.26, "#2563eb");
  ctx.fillStyle = "#f8fafc";
  ctx.font = "11px sans-serif";
  ctx.fillText("Knock down every pin.", 8, height - 8);
}

function drawFlappy(ctx: CanvasRenderingContext2D, frame: MinerFrame, width: number, height: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#38bdf8");
  sky.addColorStop(1, "#e0f2fe");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(width - 28, 28, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(48, 40, 22, 8, 0, 0, Math.PI * 2);
  ctx.ellipse(120, 56, 28, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  const rows = frame.rows.length;
  const cols = frame.rows[0]?.length ?? 1;
  const cellW = (width - 16) / cols;
  const cellH = (height - 36) / rows;
  frame.rows.forEach((row, y) => {
    row.forEach((cell, x) => {
      const px = 8 + x * cellW;
      const py = 8 + y * cellH;
      if (cell === "#") {
        ctx.fillStyle = "#14532d";
        ctx.fillRect(px + cellW * 0.62, py + 2, cellW * 0.28, cellH - 2);
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(px + 2, py + 2, cellW * 0.64, cellH - 2);
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(px + 2, py + 2, cellW * 0.64, 5);
      } else if (cell === "G") {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(px + cellW / 2, py + cellH / 2, Math.min(cellW, cellH) * 0.32, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  });
  const bx = 8 + frame.x * cellW + cellW / 2;
  const by = 8 + frame.y * cellH + cellH / 2;
  ctx.fillStyle = "rgba(15,23,42,0.18)";
  ctx.beginPath();
  ctx.ellipse(bx + 4, by + cellH * 0.35, cellW * 0.22, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.ellipse(bx - 2, by, cellW * 0.22, cellH * 0.18, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.ellipse(bx, by, cellW * 0.26, cellH * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.moveTo(bx + cellW * 0.18, by);
  ctx.lineTo(bx + cellW * 0.34, by - 3);
  ctx.lineTo(bx + cellW * 0.18, by + 4);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(bx + 4, by - 2, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(bx + 5, by - 2, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "11px sans-serif";
  ctx.fillText("flap() hops. coast() glides forward.", 8, height - 8);
}

function shade(hex: string, amount: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const channel = (value: number) => Math.max(0, Math.min(255, value + amount));
  return `rgb(${channel((n >> 16) & 255)},${channel((n >> 8) & 255)},${channel(n & 255)})`;
}

function drawDino(ctx: CanvasRenderingContext2D, frame: DinoFrame, width: number, height: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#38bdf8");
  sky.addColorStop(0.55, "#bae6fd");
  sky.addColorStop(1, "#fef3c7");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(width - 36, 32, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d6d3d1";
  ctx.beginPath();
  ctx.ellipse(54, 96, 62, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e7e5e4";
  ctx.beginPath();
  ctx.ellipse(170, 104, 78, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  const cam = frame.x - 0.35;
  const project = (x: number, y: number, z: number) => ({
    sx: 48 + (x - cam) * 74 + z * 28,
    sy: 176 - y * 68 - z * 12,
  });
  const poly = (pts: { sx: number; sy: number }[], color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(pts[0]!.sx, pts[0]!.sy);
    for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i]!.sx, pts[i]!.sy);
    ctx.closePath();
    ctx.fill();
  };
  const box = (x: number, y: number, z: number, w: number, h: number, d: number, color: string) => {
    const p = (px: number, py: number, pz: number) => project(px, py, pz);
    const backRight = p(x + w, y, z);
    const backTop = p(x + w, y + h, z);
    const topLeft = p(x, y + h, z);
    const frontLeft = p(x, y, z + d);
    const frontRight = p(x + w, y, z + d);
    const frontTopRight = p(x + w, y + h, z + d);
    const frontTopLeft = p(x, y + h, z + d);
    poly([backRight, frontRight, frontTopRight, backTop], shade(color, -42));
    poly([topLeft, backTop, frontTopRight, frontTopLeft], shade(color, 36));
    poly([frontLeft, frontRight, frontTopRight, frontTopLeft], color);
  };

  const start = Math.floor(cam) - 1;
  for (let tile = start; tile < start + 9; tile += 1) {
    box(tile, -0.42, -0.15, 0.98, 0.42, 0.7, tile % 2 === 0 ? "#e7e5e4" : "#d6d3d1");
  }
  for (const item of frame.obstacles) {
    if (item.kind === "cactus") {
      box(item.x - 0.62, 0, 0.08, 0.2, 0.92, 0.16, "#15803d");
      box(item.x - 0.86, 0.4, 0.1, 0.28, 0.12, 0.1, "#166534");
      box(item.x - 0.86, 0.4, 0.1, 0.1, 0.28, 0.1, "#166534");
      box(item.x - 0.36, 0.52, 0.1, 0.2, 0.1, 0.1, "#16a34a");
    } else if (item.kind === "bird") {
      box(item.x - 0.55, 0.78, 0.05, 0.5, 0.14, 0.14, "#57534e");
      box(item.x - 0.72, 0.86, 0.1, 0.18, 0.1, 0.1, "#44403c");
      box(item.x - 0.22, 0.9, 0.16, 0.36, 0.06, 0.06, "#a8a29e");
    } else {
      box(item.x - 0.28, 0, 0.04, 0.08, 1.05, 0.08, "#ca8a04");
      box(item.x + 0.08, 0, 0.04, 0.08, 1.05, 0.08, "#ca8a04");
      box(item.x - 0.28, 0.86, 0.05, 0.44, 0.2, 0.05, "#facc15");
    }
  }

  const x = frame.x;
  const y = frame.lift;
  const bodyH = 0.46 - frame.crouch * 0.2;
  const bodyY = y + 0.3 - frame.crouch * 0.14;
  const legH = 0.32 - frame.crouch * 0.14;
  const shadow = project(x + 0.1, 0, 0.2);
  ctx.fillStyle = `rgba(15,23,42,${Math.max(0.08, 0.28 - frame.lift * 0.14)})`;
  ctx.beginPath();
  ctx.ellipse(shadow.sx, shadow.sy + 2, Math.max(6, 16 - frame.lift * 6), 4, 0, 0, Math.PI * 2);
  ctx.fill();
  box(x - 0.48, bodyY + 0.08, 0.08, 0.34, 0.12, 0.1, "#3f6212");
  box(x - 0.02, y + (frame.leg ? 0.08 : 0), 0.02, 0.12, legH, 0.1, "#365314");
  box(x + 0.2, y + (frame.leg ? 0 : 0.08), 0.14, 0.12, legH, 0.1, "#3f6212");
  box(x - 0.16, bodyY, 0.04, 0.58, bodyH, 0.26, "#4d7c0f");
  box(x + 0.28, bodyY + bodyH - 0.08, 0.08, 0.3, 0.26 - frame.crouch * 0.06, 0.2, "#65a30d");
  box(x + 0.52, bodyY + bodyH - 0.1, 0.12, 0.14, 0.1, 0.1, "#84cc16");
  const eye = project(x + 0.46, bodyY + bodyH + 0.08, 0.26);
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.arc(eye.sx, eye.sy, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(eye.sx + 1, eye.sy, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.font = "12px sans-serif";
  ctx.fillText("Jump the cactus. Duck the bird.", 8, height - 8);
}

function drawPlatform(ctx: CanvasRenderingContext2D, level: PlatformLevel, sample: PlatformSample, width: number, height: number) {
  const tile = 24;
  const camera = Math.max(0, sample.x - 48);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#7dd3fc");
  sky.addColorStop(1, "#fef3c7");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.arc(width - 28, 26, 11, 0, Math.PI * 2);
  ctx.fill();
  level.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const screenX = x * tile - camera;
      if (screenX > width + tile || screenX + tile < -tile) continue;
      const ch = row[x];
      if (ch === "#") {
        ctx.fillStyle = "#78350f";
        ctx.fillRect(screenX + 4, y * tile + 6, tile - 2, tile - 4);
        ctx.fillStyle = "#166534";
        ctx.fillRect(screenX, y * tile, tile - 2, tile - 6);
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(screenX, y * tile, tile - 2, 5);
      } else if (ch === "F") {
        ctx.fillStyle = "#9f1239";
        ctx.fillRect(screenX + 16, y * tile, 4, tile);
        ctx.fillStyle = "#fb7185";
        ctx.beginPath();
        ctx.moveTo(screenX + 16, y * tile + 2);
        ctx.lineTo(screenX, y * tile + 8);
        ctx.lineTo(screenX + 16, y * tile + 16);
        ctx.fill();
      }
    }
  });
  const px = sample.x - camera;
  const py = sample.y;
  ctx.fillStyle = "rgba(15,23,42,0.2)";
  ctx.beginPath();
  ctx.ellipse(px + 8, py + 22, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c2410c";
  ctx.fillRect(px + 2, py + 12, 5, 10);
  ctx.fillRect(px + 9, py + 12, 5, 10);
  ctx.fillStyle = "#f97316";
  ctx.fillRect(px + 1, py + 4, 14, 12);
  ctx.fillStyle = "#ffedd5";
  ctx.beginPath();
  ctx.arc(px + 11, py + 4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(px + 13, py + 3, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

export function GameCanvas({ view }: { view: GameView }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [note, setNote] = useState("Running the script...");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setNote("Running the script...");
    const width = 240;
    const height = 220;
    const fit = () => ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    let timer = 0;
    let index = 0;
    const paintPlatform = (sample: PlatformSample | undefined) => {
      if (!view.level || !sample) return;
      drawPlatform(ctx, view.level, sample, width, height);
    };
    if (view.kind === "dino") {
      const paint = () => {
        const frame = view.dino[Math.min(index, Math.max(view.dino.length - 1, 0))];
        if (!frame) return;
        fit();
        drawDino(ctx, frame, width, height);
      };
      paint();
      timer = window.setInterval(() => {
        index += 1;
        paint();
        if (index >= view.dino.length - 1) {
          window.clearInterval(timer);
          setNote(view.message || (view.status === "win" ? "Level clear." : "Keep editing the script."));
        }
      }, 70);
    } else if (view.kind === "checkers" || view.kind === "othello" || view.kind === "flappy" || view.kind === "bowling") {
      const paint = () => {
        const frame = view.frames[Math.min(index, view.frames.length - 1)];
        if (!frame) return;
        fit();
        if (view.kind === "flappy") drawFlappy(ctx, frame, width, height);
        else if (view.kind === "checkers") drawCheckers(ctx, frame, width, height);
        else if (view.kind === "othello") drawOthello(ctx, frame, width, height);
        else drawBowling(ctx, frame, width, height);
      };
      paint();
      timer = window.setInterval(() => {
        index += 1;
        paint();
        if (index >= view.frames.length - 1) {
          window.clearInterval(timer);
          setNote(view.message || (view.status === "win" ? "Level clear." : "Keep editing the script."));
        }
      }, 320);
    } else {
      const samples = view.samples.length ? view.samples : [{ x: 4, y: 4, crashed: false }];
      fit();
      paintPlatform(samples[0]);
      timer = window.setInterval(() => {
        index += 1;
        const sample = samples[Math.min(index, samples.length - 1)];
        fit();
        paintPlatform(sample);
        if (index >= samples.length - 1) {
          window.clearInterval(timer);
          setNote(view.message || "The run finished.");
        }
      }, 1000 / 60);
    }
    return () => window.clearInterval(timer);
  }, [view]);

  return (
    <div>
      <canvas ref={canvasRef} width={720} height={660} className="h-[220px] w-full rounded-2xl border border-white/20 bg-sky-100 shadow" />
      <p className={`mt-2 text-center text-sm font-display font-bold ${view.status === "crash" ? "text-stop" : view.status === "win" ? "text-go" : "text-muted-foreground"}`}>
        {note}
      </p>
    </div>
  );
}
