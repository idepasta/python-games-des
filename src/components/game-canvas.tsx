import { useEffect, useRef, useState } from "react";
import type { GameView, MinerFrame, PlatformLevel, PlatformSample } from "@/lib/python-vm";

const BLOCK_COLOR: Record<string, string> = {
  air: "#e0f2fe",
  dirt: "#8d5a32",
  stone: "#9aa0a6",
  diamond: "#5eead4",
  plank: "#d97706",
  goal: "#facc15",
  wall: "#111827",
  mark: "#fde68a",
};

function blockName(ch: string): string {
  if (ch === "." || ch === "P") return "air";
  if (ch === "D") return "dirt";
  if (ch === "S") return "stone";
  if (ch === "*") return "diamond";
  if (ch === "G") return "goal";
  if (ch === "b") return "mark";
  if (ch === "=") return "plank";
  return "wall";
}

function drawMiner(ctx: CanvasRenderingContext2D, frame: MinerFrame, width: number, height: number) {
  const rows = frame.rows.length;
  const cols = frame.rows[0]?.length ?? 1;
  const size = Math.min(width / cols, (height - 28) / rows);
  const originX = (width - size * cols) / 2;
  const originY = 8;
  ctx.fillStyle = "#e0f2fe";
  ctx.fillRect(0, 0, width, height);
  frame.rows.forEach((row, y) => {
    row.forEach((cell, x) => {
      ctx.fillStyle = BLOCK_COLOR[blockName(cell)] ?? "#111827";
      ctx.fillRect(originX + x * size, originY + y * size, size - 1, size - 1);
    });
  });
  const px = originX + frame.x * size + size / 2;
  const py = originY + frame.y * size + size / 2;
  ctx.fillStyle = "#16a34a";
  ctx.beginPath();
  ctx.arc(px, py, size * 0.28, 0, Math.PI * 2);
  ctx.fill();
  const nudge = size * 0.28;
  const tip = frame.facing === "up" ? [0, -nudge] : frame.facing === "down" ? [0, nudge] : frame.facing === "left" ? [-nudge, 0] : [nudge, 0];
  ctx.fillStyle = "#052e16";
  ctx.fillRect(px + tip[0]! - 2, py + tip[1]! - 2, 4, 4);
  ctx.fillStyle = "#0f172a";
  ctx.font = "12px sans-serif";
  ctx.fillText(`Dirt ${frame.dirt}  Stone ${frame.stone}  Diamond ${frame.diamond}`, 8, height - 8);
}

function drawPlatform(ctx: CanvasRenderingContext2D, level: PlatformLevel, sample: PlatformSample, width: number, height: number) {
  const tile = 24;
  const camera = Math.max(0, sample.x - 48);
  ctx.fillStyle = "#bae6fd";
  ctx.fillRect(0, 0, width, height);
  level.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const screenX = x * tile - camera;
      if (screenX > width || screenX + tile < 0) continue;
      const ch = row[x];
      if (ch === "#") {
        ctx.fillStyle = "#166534";
        ctx.fillRect(screenX, y * tile, tile - 1, tile - 1);
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(screenX, y * tile, tile - 1, 5);
      } else if (ch === "F") {
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(screenX + 14, y * tile, 4, tile);
        ctx.beginPath();
        ctx.moveTo(screenX + 14, y * tile);
        ctx.lineTo(screenX + 2, y * tile + 6);
        ctx.lineTo(screenX + 14, y * tile + 12);
        ctx.fill();
      }
    }
  });
  ctx.fillStyle = "#f97316";
  ctx.fillRect(sample.x - camera, sample.y, 16, 22);
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
    const width = canvas.width;
    const height = canvas.height;
    let timer = 0;
    let index = 0;
    const paintMiner = () => {
      const frame = view.frames[Math.min(index, view.frames.length - 1)];
      if (frame) drawMiner(ctx, frame, width, height);
    };
    const paintPlatform = (sample: PlatformSample | undefined) => {
      if (!view.level || !sample) return;
      drawPlatform(ctx, view.level, sample, width, height);
    };
    if (view.kind === "miner") {
      paintMiner();
      timer = window.setInterval(() => {
        index += 1;
        paintMiner();
        if (index >= view.frames.length - 1) {
          window.clearInterval(timer);
          setNote(view.message || (view.status === "win" ? "Level clear." : "Keep editing the script."));
        }
      }, 320);
    } else {
      const samples = view.samples.length ? view.samples : [{ x: 4, y: 4, crashed: false }];
      paintPlatform(samples[0]);
      timer = window.setInterval(() => {
        index += 1;
        const sample = samples[Math.min(index, samples.length - 1)];
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
      <canvas ref={canvasRef} width={240} height={220} className="w-full rounded-xl border-2 border-foreground/20 bg-sky-100" />
      <p className={`mt-2 text-center text-sm font-display font-bold ${view.status === "crash" ? "text-stop" : view.status === "win" ? "text-go" : "text-muted-foreground"}`}>
        {note}
      </p>
    </div>
  );
}
