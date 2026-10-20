import { useEffect, useRef, useState, type ReactNode } from "react";
import { realRange, speedFine, pumpOn, lightsOn, thermostatStep } from "@/lib/rules";

function useLog() {
  const [lines, setLines] = useState<string[]>([]);
  const log = (s: string) => setLines((l) => [...l.slice(-5), s]);
  return { lines, log, clear: () => setLines([]) };
}

export function Console({ lines }: { lines: string[] }) {
  return (
    <div className="mt-4 rounded-xl bg-code p-3 font-mono text-xs text-code-foreground min-h-[7rem]">
      <div className="opacity-60 mb-1">&gt;&gt;&gt; python output</div>
      {lines.length === 0 ? <div className="opacity-50">waiting…</div> : lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
}

function Btn({ children, onClick, tone = "primary", disabled }: { children: ReactNode; onClick: () => void; tone?: "primary" | "accent" | "secondary"; disabled?: boolean }) {
  const t = tone === "primary" ? "bg-primary text-primary-foreground" : tone === "accent" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground";
  return <button disabled={disabled} onClick={onClick} className={`press rounded-xl px-4 py-2 font-display font-semibold disabled:opacity-40 ${t}`}>{children}</button>;
}

function Slider({ label, value, min, max, onChange, unit }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; unit: string }) {
  return (
    <label className="block">
      <div className="flex justify-between font-display font-semibold"><span>{label}</span><span>{value}{unit}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-primary" />
    </label>
  );
}

function useTimer() {
  const ref = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => ref.current.forEach(clearTimeout), []);
  return (fn: () => void, ms: number) => ref.current.push(setTimeout(fn, ms));
}

/* 1 */ function Traffic() {
  const { lines, log } = useLog(); const later = useTimer();
  const [green, setGreen] = useState(false);
  const car = () => {
    if (green) return;
    log("sensor_reading = 1"); log("Sensor triggered! Changing lights to GREEN 🟢"); setGreen(true);
    later(() => { setGreen(false); log("Changing back to RED 🔴."); }, 3000);
  };
  return (<div>
    <div className="flex items-center gap-6">
      <div className="rounded-2xl bg-code p-3 space-y-2">
        <div className={`size-12 rounded-full ${!green ? "bg-stop glow-stop" : "bg-off"}`} />
        <div className="size-12 rounded-full bg-off" />
        <div className={`size-12 rounded-full ${green ? "bg-go glow-go" : "bg-off"}`} />
      </div>
      <div className="space-y-2 flex flex-col">
        <Btn onClick={car}>🚗 Drive car over loop</Btn>
        <Btn tone="secondary" onClick={() => log("sensor_reading = 0 → 🚲 too little metal! Light remains RED 🔴.")}>🚲 Carbon bike</Btn>
      </div>
    </div><Console lines={lines} /></div>);
}

/* 2 */ function EV() {
  const [t, setT] = useState(15); const r = realRange(400, t);
  return (<div className="space-y-3">
    <Slider label="🌡️ Outside temp" value={t} min={-20} max={30} unit="°C" onChange={setT} />
    <div className="h-8 rounded-full bg-muted overflow-hidden chunky"><div className={`h-full transition-all ${r < 250 ? "bg-stop" : "bg-go"}`} style={{ width: `${r / 4}%` }} /></div>
    <Console lines={[`calculate_real_range(400, ${t})`, `Real Range: ${r}km`, ...(t < 0 ? ["Warning: Freezing temps! ❄️"] : [])]} />
  </div>);
}

/* 3 */ function Sanitizer() {
  const [d, setD] = useState(25); const on = pumpOn(d);
  return (<div className="space-y-3">
    <Slider label="🖐️ Hand distance" value={d} min={2} max={30} unit=" cm" onChange={setD} />
    <div className="relative h-40 rounded-xl bg-muted chunky overflow-hidden">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-20 h-8 bg-primary rounded-b-xl" />
      {on && <div className="absolute left-1/2 -translate-x-1/2 top-8 text-2xl animate-bounce">💧</div>}
      <div className="absolute left-1/2 -translate-x-1/2 text-5xl transition-all" style={{ top: `${20 + d * 3.5}px` }}>🖐️</div>
    </div>
    <Console lines={[`IR Sensor reads: ${d} cm`, on ? "🖐️ Hand detected! PUMP ON: Dispensing gel." : "..."]} />
  </div>);
}

/* 4 */ function Radar() {
  const { lines, log } = useLog(); const later = useTimer();
  const [s, setS] = useState(90); const [flash, setFlash] = useState(false);
  const drive = (speed: number, who = "Vehicle") => {
    log(`${who} detected traveling at ${speed} km/h.`);
    if (speed > 100) { setFlash(true); later(() => setFlash(false), 400); log(`📸 FLASH! Fine: €${speedFine(speed)}`); }
    else log("Vehicle speed acceptable.");
  };
  return (<div className="space-y-3">
    <div className={`rounded-xl p-4 text-center text-5xl transition ${flash ? "bg-warn glow-warn" : "bg-muted"}`}>📷 🚙</div>
    <Slider label="Speed" value={s} min={60} max={140} unit=" km/h" onChange={setS} />
    <div className="flex flex-wrap gap-2"><Btn onClick={() => drive(s)}>Drive past!</Btn>
      <Btn tone="accent" onClick={() => drive(60 + Math.floor(Math.random() * 81), "Random car")}>🎲 random.randint</Btn></div>
    <Console lines={lines} /></div>);
}

/* 5 */ function Doors() {
  const { lines, log } = useLog(); const later = useTimer(); const [open, setOpen] = useState(false);
  const trig = (why: string) => {
    if (open) return; log(why); log("motion_detected = True → OPEN doors for 4 seconds"); setOpen(true);
    later(() => { setOpen(false); log("Closing doors safely."); }, 4000);
  };
  return (<div>
    <div className="flex h-36 rounded-xl bg-code overflow-hidden chunky">
      <div className={`bg-cool/70 border-r-2 transition-all duration-700 ${open ? "w-2" : "w-1/2"}`} />
      <div className="flex-1 grid place-items-center text-4xl">🛒</div>
      <div className={`bg-cool/70 border-l-2 transition-all duration-700 ${open ? "w-2" : "w-1/2"}`} />
    </div>
    <div className="flex flex-wrap gap-2 mt-3"><Btn onClick={() => trig("🚶 Heat signature detected!")}>🚶 Walk up</Btn>
      <Btn tone="accent" onClick={() => trig("☀️ Hot air burst… 👻 GHOST OPENING!")}>☀️ Hot air</Btn></div>
    <Console lines={lines} /></div>);
}

/* 6 */ function Thermo() {
  const [t, setT] = useState(18); const [run, setRun] = useState(false); const { lines, log } = useLog();
  useEffect(() => { if (!run) return; const id = setInterval(() => setT((x) => { const r = thermostatStep(x); log(`Room ${x}°C → ${r.msg}`); return r.t; }), 1200); return () => clearInterval(id); }, [run]);
  return (<div>
    <div className="flex items-center gap-4">
      <div className={`size-28 rounded-full chunky grid place-items-center font-display text-3xl ${t < 20 ? "bg-cool" : t >= 24 ? "bg-accent" : "bg-secondary"}`}>{t}°</div>
      <div className="space-y-2 flex flex-col"><Btn onClick={() => setRun(!run)}>{run ? "⏸ Stop loop" : "▶ while True"}</Btn>
        <Btn tone="secondary" onClick={() => setT(18)}>Reset 18°C</Btn></div>
    </div>
    <p className="text-sm mt-2 text-muted-foreground">Deadband: between 20°C and 24°C the boiler rests.</p>
    <Console lines={lines} /></div>);
}

/* 7 */ function Plant() {
  const [m, setM] = useState(40); const [run, setRun] = useState(false); const { lines, log } = useLog();
  useEffect(() => { if (!run) return; const id = setInterval(() => setM((x) => { if (x < 30) { log("💧 CRITICAL: Moisture low! Pump ON → ✅ 60%"); return 60; } log(`Current moisture: ${x - 5}%`); return x - 5; }), 1000); return () => clearInterval(id); }, [run]);
  return (<div>
    <div className="flex items-end gap-4">
      <div className="text-6xl">{m < 30 ? "🥀" : "🌱"}</div>
      <div className="flex-1 h-6 rounded-full bg-muted chunky overflow-hidden"><div className={`h-full transition-all ${m < 30 ? "bg-stop" : "bg-cool"}`} style={{ width: `${m}%` }} /></div>
      <span className="font-display font-bold">{m}%</span>
    </div>
    <div className="mt-3"><Btn onClick={() => setRun(!run)}>{run ? "⏸ Stop" : "☀️ Let the sun shine"}</Btn></div>
    <Console lines={lines} /></div>);
}

/* 8 */ function Vending() {
  const [bal, setBal] = useState(0); const { lines, log, clear } = useLog(); const done = bal >= 1.5;
  const add = (c: number) => { if (done) return; const b = +(bal + c).toFixed(2); setBal(b); log(`Accepted €${c.toFixed(2)}. Balance: €${b.toFixed(2)}`);
    if (b >= 1.5) { log("✅ MOTOR UNLOCKED: Dispensing Snack."); if (b > 1.5) log(`🪙 Change: €${(b - 1.5).toFixed(2)}`); } };
  return (<div>
    <div className="flex items-center gap-4"><div className="text-6xl">{done ? "🍫" : "🏧"}</div>
      <div className="font-display text-2xl">€{bal.toFixed(2)} / €1.50</div></div>
    <div className="flex flex-wrap gap-2 mt-3">
      {[0.25, 0.5, 1].map((c) => <Btn key={c} onClick={() => add(c)} disabled={done}>🪙 €{c.toFixed(2)}</Btn>)}
      <Btn tone="accent" onClick={() => log("🧊 Ice coin rejected: wrong metallic signature!")}>🧊 Ice coin</Btn>
      <Btn tone="secondary" onClick={() => { setBal(0); clear(); }}>Reset</Btn>
    </div><Console lines={lines} /></div>);
}

/* 9 */ function Fridge() {
  const [open, setOpen] = useState(false); const [sec, setSec] = useState(0); const [magnet, setMagnet] = useState(false);
  const sensed = open && !magnet;
  useEffect(() => { if (!sensed) { setSec(0); return; } const id = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(id); }, [sensed]);
  const alarm = sec > 5;
  return (<div>
    <div className={`h-36 rounded-xl chunky grid place-items-center text-6xl transition ${alarm ? "bg-stop animate-pulse" : "bg-cool/40"}`}>{open ? "🧊🥛🍎" : "🚪"}{magnet && "🧲"}</div>
    <div className="flex flex-wrap gap-2 mt-3"><Btn onClick={() => setOpen(!open)}>{open ? "Close door" : "Open door"}</Btn>
      <Btn tone="accent" onClick={() => setMagnet(!magnet)}>{magnet ? "Remove magnet" : "🧲 Stick magnet"}</Btn></div>
    <Console lines={[`door_sensor = "${sensed ? "OPEN" : "CLOSED"}"`, ...(sensed ? [`Door has been open for ${sec} seconds...`] : []), ...(open && magnet ? ["😱 Magnet tricks sensor — no alarm!"] : []), ...(alarm ? ["🚨 ALARM TRIGGERED! BEEP BEEP BEEP!"] : [])]} />
  </div>);
}

/* 10 */ function Street() {
  const [sun, setSun] = useState(100); const later = useTimer(); const on = lightsOn(sun);
  return (<div className="space-y-3">
    <div className={`h-36 rounded-xl chunky relative transition-colors duration-700 ${on ? "bg-code" : "bg-cool"}`}>
      <div className="absolute top-3 right-4 text-4xl">{on ? "🌙" : "☀️"}</div>
      <div className="absolute bottom-0 left-8 w-2 h-24 bg-off" />
      <div className={`absolute bottom-24 left-6 size-6 rounded-full ${on ? "bg-warn glow-warn" : "bg-off"}`} />
    </div>
    <Slider label="Sunlight" value={sun} min={0} max={100} unit="%" onChange={setSun} />
    <Btn tone="accent" onClick={() => { const p = sun; setSun(5); later(() => setSun(p), 3000); }}>🌑 Solar eclipse!</Btn>
    <Console lines={[`Sensor reading: ${sun}% sunlight.`, on ? "💡 It is getting dark. Streetlights ON." : "☀️ Sufficient daylight. Streetlights OFF."]} />
  </div>);
}

export const games = [Traffic, EV, Sanitizer, Radar, Doors, Thermo, Plant, Vending, Fridge, Street];
