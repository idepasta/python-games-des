import { useEffect, useRef, useState, type ReactNode } from "react";
import { useExtras } from "@/components/game-extras";
import { extendedRange, detectsMetal, dispenserDose, radarFine, doorsTriggered, extendedThermostat, plantStep, vendingResult, fridgeAlarm, streetBrightness } from "@/lib/extras";

function useLog() {
  const [lines, setLines] = useState<string[]>([]);
  const log = (s: string) => setLines((l) => [...l.slice(-5), s]);
  return { lines, log, clear: () => setLines([]) };
}
export function Console({ lines }: { lines: string[] }) {
  return (<div className="mt-4 rounded-xl bg-code p-3 font-mono text-xs text-code-foreground min-h-[7rem]">
    <div className="opacity-60 mb-1">&gt;&gt;&gt; python output</div>
    {lines.length === 0 ? <div className="opacity-50">waiting…</div> : lines.map((l, i) => <div key={i}>{l}</div>)}
  </div>);
}
function Btn({ children, onClick, tone = "primary", disabled }: { children: ReactNode; onClick: () => void; tone?: "primary" | "accent" | "secondary"; disabled?: boolean }) {
  const t = tone === "primary" ? "bg-primary text-primary-foreground" : tone === "accent" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground";
  return <button disabled={disabled} onClick={onClick} className={`press rounded-xl px-4 py-2 font-display font-semibold disabled:opacity-40 ${t}`}>{children}</button>;
}
function Slider({ label, value, min, max, onChange, unit }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; unit: string }) {
  return (<label className="block">
    <div className="flex justify-between font-display font-semibold"><span>{label}</span><span>{value}{unit}</span></div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-primary" />
  </label>);
}
function useTimer() {
  const ref = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => ref.current.forEach(clearTimeout), []);
  return (fn: () => void, ms: number) => ref.current.push(setTimeout(fn, ms));
}
function useSync(values: Record<string, number | boolean | string>) {
  const { setInputs } = useExtras(); const key = JSON.stringify(values);
  useEffect(() => setInputs(values), [key]);
}

/* 1 */ function Traffic() {
  const { settings: s } = useExtras(); const { lines, log } = useLog(); const later = useTimer();
  const [green, setGreen] = useState(false); const [metal, setMetal] = useState(100); const [bike, setBike] = useState(false);
  useSync({ metal, bike });
  const car = (m: number, button = false) => {
    setMetal(m); setBike(button); if (green) return;
    if (detectsMetal(m, s) || (s.enabled && button)) { log(button ? "🚲 Bike button pressed → GREEN 🟢" : `metal = ${m}% → GREEN 🟢`); setGreen(true); later(() => { setGreen(false); log("Changing back to RED 🔴."); }, s.a * 1000); }
    else log(`metal = ${m}% < ${s.b}% → stays RED 🔴`);
  };
  return (<div><div className="flex items-center gap-6">
    <div className="rounded-2xl bg-code p-3 space-y-2">
      <div className={`size-12 rounded-full ${!green ? "bg-stop glow-stop" : "bg-off"}`} /><div className="size-12 rounded-full bg-off" />
      <div className={`size-12 rounded-full ${green ? "bg-go glow-go" : "bg-off"}`} />
    </div>
    <div className="space-y-2 flex flex-col">
      <Btn onClick={() => car(100)}>🚗 Car (100% metal)</Btn>
      <Btn tone="secondary" onClick={() => car(20)}>🚲 Carbon bike (20%)</Btn>
      {s.enabled && <Btn tone="accent" onClick={() => car(20, true)}>🔘 Press bike button</Btn>}
    </div></div><Console lines={lines} /></div>);
}

/* 2 */ function EV() {
  const { settings: s } = useExtras(); const [t, setT] = useState(15); const r = extendedRange(t, s); useSync({ temperature: t });
  return (<div className="space-y-3">
    <Slider label="🌡️ Outside temp" value={t} min={-20} max={30} unit="°C" onChange={setT} />
    <div className="h-8 rounded-full bg-muted overflow-hidden chunky"><div className={`h-full transition-all ${r < s.a * 0.6 ? "bg-stop" : "bg-go"}`} style={{ width: `${Math.min(100, r / 6)}%` }} /></div>
    <Console lines={[`Real Range: ${r}km`, ...(s.enabled ? ["🔥 Cabin heating is using battery"] : []), ...(t < 0 ? ["Warning: Freezing temps! ❄️"] : [])]} />
  </div>);
}

/* 3 */ function Sanitizer() {
  const { settings: s } = useExtras(); const [d, setD] = useState(25); const dose = dispenserDose(d, s); useSync({ distance: d });
  return (<div className="space-y-3">
    <Slider label="🖐️ Hand distance" value={d} min={2} max={30} unit=" cm" onChange={setD} />
    <div className="relative h-40 rounded-xl bg-muted chunky overflow-hidden">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-20 h-8 bg-primary rounded-b-xl" />
      {dose > 0 && <div className="absolute left-1/2 -translate-x-1/2 top-8 text-2xl animate-bounce">{"💧".repeat(dose)}</div>}
      <div className="absolute left-1/2 -translate-x-1/2 text-5xl transition-all" style={{ top: `${20 + d * 3.5}px` }}>🖐️</div>
    </div>
    <Console lines={[`IR Sensor reads: ${d} cm`, s.enabled && d < s.a ? "⚠️ Gel tank empty. Refill!" : dose ? `PUMP ON: ${dose}ml gel` : "..."]} />
  </div>);
}

/* 4 */ function Radar() {
  const { settings: s } = useExtras(); const { lines, log } = useLog(); const later = useTimer();
  const [sp, setSp] = useState(90); const [flash, setFlash] = useState(false); const [bird, setBird] = useState(false);
  useSync({ speed: sp, bird });
  const drive = (speed: number, b = false) => {
    setSp(speed); setBird(b); const fine = radarFine(speed, b, s);
    log(`${b ? "🐦 Bird" : "Vehicle"} at ${speed} km/h`);
    if (fine > 0) { setFlash(true); later(() => setFlash(false), 400); log(`📸 FLASH! Fine: €${fine}`); }
    else log(b && s.enabled ? "Bird ignored ✅" : "Speed acceptable.");
  };
  return (<div className="space-y-3">
    <div className={`rounded-xl p-4 text-center text-5xl transition ${flash ? "bg-warn glow-warn" : "bg-muted"}`}>📷 {bird ? "🐦" : "🚙"}</div>
    <Slider label="Speed" value={sp} min={20} max={160} unit=" km/h" onChange={setSp} />
    <div className="flex flex-wrap gap-2"><Btn onClick={() => drive(sp)}>Drive past!</Btn>
      <Btn tone="accent" onClick={() => drive(20 + Math.floor(Math.random() * 141))}>🎲 random</Btn>
      <Btn tone="secondary" onClick={() => drive(s.a + 15, true)}>🐦 Bird flies by</Btn></div>
    <Console lines={lines} /></div>);
}

/* 5 */ function Doors() {
  const { settings: s } = useExtras(); const { lines, log } = useLog(); const later = useTimer();
  const [open, setOpen] = useState(false); const [heat, setHeat] = useState(100); useSync({ heat });
  const trig = (h: number, why: string) => {
    setHeat(h); if (open) return; log(why);
    if (!doorsTriggered(h, s)) return log(`heat ${h}% < ${s.b}% → stay closed`);
    log(`OPEN doors for ${s.a} seconds`); setOpen(true);
    later(() => { if (s.enabled) return log("🚧 Safety beam blocked: stay OPEN"); setOpen(false); log("Closing doors safely."); }, s.a * 1000);
  };
  return (<div>
    <div className="flex h-36 rounded-xl bg-code overflow-hidden chunky">
      <div className={`bg-cool/70 border-r-2 transition-all duration-700 ${open ? "w-2" : "w-1/2"}`} /><div className="flex-1 grid place-items-center text-4xl">🛒</div>
      <div className={`bg-cool/70 border-l-2 transition-all duration-700 ${open ? "w-2" : "w-1/2"}`} />
    </div>
    <div className="flex flex-wrap gap-2 mt-3"><Btn onClick={() => trig(90, "🚶 Person (90% heat)")}>🚶 Walk up</Btn>
      <Btn tone="accent" onClick={() => trig(60, "☀️ Hot air (60% heat)")}>☀️ Hot air</Btn>
      <Btn tone="secondary" onClick={() => trig(20, "🐈 Small cat (20% heat)")}>🐈 Cat</Btn>
      {open && <Btn tone="secondary" onClick={() => setOpen(false)}>Close manually</Btn>}</div>
    <Console lines={lines} /></div>);
}

/* 6 */ function Thermo() {
  const { settings: s } = useExtras(); const [t, setT] = useState(18); const [run, setRun] = useState(false); const { lines, log } = useLog();
  useSync({ temperature: t });
  useEffect(() => { if (!run) return; const id = setInterval(() => setT((x) => { const r = extendedThermostat(x, s); log(`Room ${x}°C → ${r.msg}`); return r.t; }), 1200); return () => clearInterval(id); }, [run, s]);
  return (<div><div className="flex items-center gap-4">
    <div className={`size-28 rounded-full chunky grid place-items-center font-display text-3xl ${t < s.a ? "bg-cool" : t >= s.b ? "bg-accent" : "bg-secondary"}`}>{t}°</div>
    <div className="space-y-2 flex flex-col"><Btn onClick={() => setRun(!run)}>{run ? "⏸ Stop loop" : "▶ while True"}</Btn><Btn tone="secondary" onClick={() => setT(18)}>Reset 18°C</Btn></div>
  </div><p className="text-sm mt-2 text-muted-foreground">Heating below {s.a}°C, upper boundary {s.b}°C{s.enabled ? ", window open 🪟" : ""}.</p><Console lines={lines} /></div>);
}

/* 7 */ function Plant() {
  const { settings: s } = useExtras(); const [m, setM] = useState(40); const [run, setRun] = useState(false); const { lines, log } = useLog();
  useSync({ moisture: m });
  useEffect(() => { if (!run) return; const id = setInterval(() => setM((x) => { const n = plantStep(x, s); log(x < s.a ? (s.enabled ? "⚠️ Tank empty! Refill." : "💧 Pump ON → 60%") : `Moisture: ${n}%`); return n; }), 1000); return () => clearInterval(id); }, [run, s]);
  return (<div><div className="flex items-end gap-4">
    <div className="text-6xl">{m < s.a ? "🥀" : "🌱"}</div>
    <div className="flex-1 h-6 rounded-full bg-muted chunky overflow-hidden"><div className={`h-full transition-all ${m < s.a ? "bg-stop" : "bg-cool"}`} style={{ width: `${m}%` }} /></div>
    <span className="font-display font-bold">{m}%</span></div>
    <div className="mt-3 flex gap-2"><Btn onClick={() => setRun(!run)}>{run ? "⏸ Stop" : "☀️ Let the sun shine"}</Btn><Btn tone="secondary" onClick={() => setM(40)}>Reset</Btn></div>
    <Console lines={lines} /></div>);
}

/* 8 */ function Vending() {
  const { settings: s } = useExtras(); const [bal, setBal] = useState(0); const [stock, setStock] = useState(s.b); const [coins, setCoins] = useState<string[]>([]);
  const { lines, log, clear } = useLog(); const [done, setDone] = useState(false);
  useEffect(() => { setStock(s.b); }, [s.b]);
  useSync({ balance: bal, stock, coins: `[${coins.join(", ")}]` });
  const add = (c: number, metal = true) => {
    if (done) return; setCoins((x) => [...x, `(${c.toFixed(2)}, ${metal ? "True" : "False"})`]);
    if (stock === 0) return log("Out of stock. Coin returned");
    if (!metal && !s.enabled) return log("🧊 Ice coin rejected!");
    const b = +(bal + c).toFixed(2); setBal(b); log(`Accepted €${c.toFixed(2)}. Balance €${b.toFixed(2)}`);
    const r = vendingResult(b, stock, s);
    if (r.dispense) { setDone(true); setStock(stock - 1); log("✅ Snack dispensed!"); if (r.change) log(`🪙 Change €${r.change.toFixed(2)}`); }
  };
  return (<div>
    <div className="flex items-center gap-4"><div className="text-6xl">{done ? "🍫" : "🏧"}</div><div className="font-display text-2xl">€{bal.toFixed(2)} / €{s.a.toFixed(2)}<div className="text-sm">Stock: {stock}</div></div></div>
    <div className="flex flex-wrap gap-2 mt-3">
      {[0.25, 0.5, 1].map((c) => <Btn key={c} onClick={() => add(c)} disabled={done}>🪙 €{c.toFixed(2)}</Btn>)}
      <Btn tone="accent" onClick={() => add(1, false)} disabled={done}>🧊 Ice coin</Btn>
      <Btn tone="secondary" onClick={() => { setBal(0); setDone(false); setCoins([]); clear(); }}>Next customer</Btn>
    </div><Console lines={lines} /></div>);
}

/* 9 */ function Fridge() {
  const { settings: s } = useExtras(); const [open, setOpen] = useState(false); const [sec, setSec] = useState(0); const [magnet, setMagnet] = useState(false);
  const sensed = open && !magnet; useSync({ seconds: sec, sensed, open, magnet });
  useEffect(() => { if (!sensed) { setSec(0); return; } const id = setInterval(() => setSec((x) => x + 1), 1000); return () => clearInterval(id); }, [sensed]);
  const alarm = fridgeAlarm(sec, sensed, s);
  return (<div>
    <div className={`h-36 rounded-xl chunky grid place-items-center text-6xl transition ${alarm ? "bg-stop animate-pulse" : "bg-cool/40"}`}>{open ? "🧊🥛🍎" : "🚪"}{magnet && "🧲"}</div>
    <div className="flex flex-wrap gap-2 mt-3"><Btn onClick={() => setOpen(!open)}>{open ? "Close door" : "Open door"}</Btn>
      <Btn tone="accent" onClick={() => setMagnet(!magnet)}>{magnet ? "Remove magnet" : "🧲 Stick magnet"}</Btn></div>
    <Console lines={[`Door open: ${sec}s, temp ${(s.b + sec * 0.2).toFixed(1)}°C`, ...(open && magnet ? ["😱 Magnet tricks sensor!"] : []), ...(sensed && sec > s.a && s.enabled ? ["🔇 Buzzer muted"] : []), ...(alarm ? ["🚨 BEEP BEEP BEEP!"] : [])]} />
  </div>);
}

/* 10 */ function Street() {
  const { settings: s } = useExtras(); const [sun, setSun] = useState(100); const [motion, setMotion] = useState(false); const later = useTimer();
  const b = streetBrightness(sun, motion, s); useSync({ sunlight: sun, motion });
  return (<div className="space-y-3">
    <div className={`h-36 rounded-xl chunky relative transition-colors duration-700 ${sun < s.a ? "bg-code" : "bg-cool"}`}>
      <div className="absolute top-3 right-4 text-4xl">{sun < s.a ? "🌙" : "☀️"}</div>
      <div className="absolute bottom-0 left-8 w-2 h-24 bg-off" />
      <div className={`absolute bottom-24 left-6 size-6 rounded-full ${b ? "bg-warn glow-warn" : "bg-off"}`} style={{ opacity: b ? 0.3 + b / 140 : 1 }} />
      {motion && <div className="absolute bottom-1 left-14 text-3xl">🚶</div>}
    </div>
    <Slider label="Sunlight" value={sun} min={0} max={100} unit="%" onChange={setSun} />
    <div className="flex flex-wrap gap-2"><Btn tone="accent" onClick={() => { const p = sun; setSun(5); later(() => setSun(p), 3000); }}>🌑 Solar eclipse!</Btn>
      <Btn tone="secondary" onClick={() => setMotion(!motion)}>{motion ? "Person leaves" : "🚶 Person walks by"}</Btn></div>
    <Console lines={[`Sensor reading: ${sun}% sunlight.`, b ? `💡 Streetlights ON at ${b}%` : "Streetlights OFF."]} />
  </div>);
}

export const games = [Traffic, EV, Sanitizer, Radar, Doors, Thermo, Plant, Vending, Fridge, Street];
