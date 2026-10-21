export type ExtraSettings = { a: number; b: number; enabled: boolean };
export type InputValues = Record<string, number | boolean | string>;
export type ExtraDefinition = {
  a: { label: string; min: number; max: number; step: number; unit: string; initial: number };
  b: { label: string; min: number; max: number; step: number; unit: string; initial: number };
  toggle: string;
};
const setting = (label: string, min: number, max: number, step: number, unit: string, initial: number) => ({ label, min, max, step, unit, initial });
export const extraDefinitions: ExtraDefinition[] = [
  { a: setting('Green duration', 1, 10, 1, ' s', 5), b: setting('Metal detection threshold', 10, 100, 10, '%', 50), toggle: 'Add a bicycle push button' },
  { a: setting('Full-charge range', 200, 600, 50, ' km', 400), b: setting('Battery charge', 10, 100, 10, '%', 100), toggle: 'Cabin heating (20% extra loss)' },
  { a: setting('Detection distance', 5, 20, 1, ' cm', 10), b: setting('Gel per dose', 1, 5, 1, ' ml', 1), toggle: 'Empty gel tank' },
  { a: setting('Speed limit', 30, 130, 10, ' km/h', 100), b: setting('Fine per extra km/h', 1, 10, 1, ' €', 5), toggle: 'Ignore birds' },
  { a: setting('Door hold time', 1, 10, 1, ' s', 4), b: setting('Heat detection threshold', 10, 100, 10, '%', 50), toggle: 'Safety beam blocked' },
  { a: setting('Heating below', 16, 21, 1, '°C', 20), b: setting('Upper boundary', 22, 28, 1, '°C', 24), toggle: 'Open window (extra heat loss)' },
  { a: setting('Water below', 10, 50, 5, '%', 30), b: setting('Drying per step', 1, 10, 1, '%', 5), toggle: 'Empty water tank' },
  { a: setting('Snack price', 0.5, 3, 0.25, ' €', 1.5), b: setting('Snacks in stock', 0, 5, 1, '', 3), toggle: 'Disable metal check (accept ice coins)' },
  { a: setting('Alarm after', 2, 15, 1, ' s', 5), b: setting('Starting fridge temperature', 2, 8, 1, '°C', 4), toggle: 'Mute buzzer' },
  { a: setting('Darkness threshold', 10, 50, 5, '%', 25), b: setting('Lamp brightness', 10, 100, 10, '%', 100), toggle: 'Motion-only lighting' },
];
export function initialExtras(n: number): ExtraSettings {
  const definition = extraDefinitions[n];
  return { a: definition?.a.initial ?? 0, b: definition?.b.initial ?? 0, enabled: false };
}
export const extendedRange = (temperature: number, s: ExtraSettings) => Math.round(Math.max(0, temperature >= 15 ? 1 : 1 - (15 - temperature) * 0.02) * s.a * s.b / 100 * (s.enabled ? 0.8 : 1));
export const detectsMetal = (metal: number, s: ExtraSettings) => metal >= s.b;
export const dispenserDose = (distance: number, s: ExtraSettings) => distance < s.a && !s.enabled ? s.b : 0;
export const radarFine = (speed: number, bird: boolean, s: ExtraSettings) => bird && s.enabled ? 0 : Math.max(0, speed - s.a) * s.b;
export const doorsTriggered = (heat: number, s: ExtraSettings) => heat >= s.b || s.enabled;
export function extendedThermostat(t: number, s: ExtraSettings) {
  const heating = t < s.a;
  return { t: t + (heating ? 2 : -1) - (s.enabled ? 1 : 0), msg: heating ? '🔥 Activating Boiler. Heating the room...' : t >= s.b ? '🛑 Target reached. Boiler OFF.' : 'Standby mode.' };
}
export const plantStep = (moisture: number, s: ExtraSettings) => moisture < s.a ? s.enabled ? moisture : 60 : Math.max(0, moisture - s.b);
export const vendingResult = (balance: number, stock: number, s: ExtraSettings) => ({ dispense: balance >= s.a && stock > 0, change: balance >= s.a && stock > 0 ? +(balance - s.a).toFixed(2) : 0 });
export const fridgeAlarm = (seconds: number, sensed: boolean, s: ExtraSettings) => sensed && seconds > s.a && !s.enabled;
export const streetBrightness = (sun: number, motion: boolean, s: ExtraSettings) => sun < s.a && (!s.enabled || motion) ? s.b : 0;
const pyBool = (v: unknown) => v ? 'True' : 'False';
export function customizedPython(n: number, s: ExtraSettings, v: InputValues): { p1: string; p2: string } {
  const num = (key: string, fallback: number) => typeof v[key] === 'number' ? v[key] : fallback;
  const bool = (key: string) => pyBool(v[key]);
  let p1 = ''; let p2 = '';
  switch (n) {
    case 0:
      p1 = `metal = ${num('metal', 100)}\nthreshold = ${s.b}\nbike_button = ${bool('bike')}\n\nif metal >= threshold${s.enabled ? ' or bike_button' : ''}:\n    print("GREEN 🟢")\nelse:\n    print("RED 🔴")`;
      p2 = `import time\n\ngreen_seconds = ${s.a}\nmetal_threshold = ${s.b}\n${s.enabled ? 'bicycle_button_enabled = True\n' : ''}\ndef check_vehicle(metal, bike_button=False):\n    detected = metal >= metal_threshold${s.enabled ? ' or (bicycle_button_enabled and bike_button)' : ''}\n    if detected:\n        print("GREEN 🟢")\n        time.sleep(green_seconds)\n        print("RED 🔴")\n    else:\n        print("Not enough metal. RED 🔴")\n\ncheck_vehicle(${num('metal', 100)}, bike_button=${bool('bike')})`;
      break;
    case 1:
      p1 = `temperature = ${num('temperature', 15)}\nbase_range = ${s.a}\nbattery_percent = ${s.b}\n\nefficiency = max(0, 1 - max(0, 15 - temperature) * 0.02)\nrange_km = base_range * efficiency * battery_percent / 100${s.enabled ? '\nrange_km = range_km * 0.8  # Cabin heating' : ''}\nprint(f"Real Range: {round(range_km)}km")`;
      p2 = `def calculate_real_range(base_range, outside_temp, battery_percent${s.enabled ? ', cabin_heating=False' : ''}):\n    if outside_temp >= 15:\n        efficiency = 1.0\n    else:\n        efficiency = max(0, 1 - (15 - outside_temp) * 0.02)\n    actual_range = base_range * efficiency * battery_percent / 100${s.enabled ? '\n    if cabin_heating:\n        actual_range = actual_range * 0.8' : ''}\n    return round(actual_range)\n\nprint(calculate_real_range(${s.a}, ${num('temperature', 15)}, ${s.b}${s.enabled ? ', cabin_heating=True' : ''}))`;
      break;
    case 2:
      p1 = `distance = ${num('distance', 25)}\ndose_ml = ${s.b}\n${s.enabled ? 'tank_empty = True\n' : ''}\nif distance < ${s.a}${s.enabled ? ' and not tank_empty' : ''}:\n    print(f"PUMP ON: {dose_ml}ml")\nelse:\n    print("PUMP OFF")`;
      p2 = `import time\n\ndetection_distance = ${s.a}\ndose_ml = ${s.b}\n${s.enabled ? 'tank_empty = True\n' : ''}\ndef dispense(distance):\n    if ${s.enabled ? 'tank_empty:\n        print("Refill gel tank. PUMP OFF")\n    elif ' : ''}distance < detection_distance:\n        print(f"Dispensing {dose_ml}ml")\n        time.sleep(1)\n        print("Pump stopped")\n        time.sleep(3)  # Anti-spam delay\n    else:\n        print("No hand detected")\n\ndispense(${num('distance', 25)})`;
      break;
    case 3:
      p1 = `speed = ${num('speed', 90)}\nlimit = ${s.a}\n${s.enabled ? `is_bird = ${bool('bird')}\n` : ''}\nif speed > limit${s.enabled ? ' and not is_bird' : ''}:\n    fine = (speed - limit) * ${s.b}\n    print(f"FLASH! Fine: €{fine}")\nelse:\n    print("No ticket")`;
      p2 = `limit = ${s.a}\neuros_per_kmh = ${s.b}\n\ndef check_speed(speed, is_bird=False):\n${s.enabled ? '    if is_bird:\n        print("Bird ignored")\n        return\n' : ''}    if speed > limit:\n        fine = (speed - limit) * euros_per_kmh\n        print(f"📸 FLASH! Fine: €{fine}")\n    else:\n        print("Vehicle speed acceptable.")\n\ncheck_speed(${num('speed', 90)}, is_bird=${bool('bird')})`;
      break;
    case 4:
      p1 = `heat_signature = ${num('heat', 100)}\nthreshold = ${s.b}\n${s.enabled ? 'safety_beam_blocked = True\n' : ''}\nif heat_signature >= threshold${s.enabled ? ' or safety_beam_blocked' : ''}:\n    print("OPEN doors")\nelse:\n    print("Doors closed")`;
      p2 = `import time\n\nhold_seconds = ${s.a}\nheat_threshold = ${s.b}\n${s.enabled ? 'safety_beam_blocked = True\n' : ''}\ndef check_doors(heat):\n    if heat >= heat_threshold${s.enabled ? ' or safety_beam_blocked' : ''}:\n        print("OPEN doors")\n        time.sleep(hold_seconds)\n${s.enabled ? '        if safety_beam_blocked:\n            print("Keep OPEN: safety beam blocked")\n            return\n' : ''}        print("Closing doors safely.")\n    else:\n        print("Doors remain closed.")\n\ncheck_doors(${num('heat', 100)})`;
      break;
    case 5:
      p1 = `room_temp = ${num('temperature', 18)}\n\nif room_temp < ${s.a}:\n    room_temp += 2\n    print("Heating ON")\nelif room_temp >= ${s.b}:\n    room_temp -= 1\n    print("Boiler OFF")\nelse:\n    room_temp -= 1\n    print("Standby")${s.enabled ? '\nroom_temp -= 1  # Open window' : ''}\nprint(room_temp)`;
      p2 = `import time\n\nroom_temp = ${num('temperature', 18)}\nheat_below = ${s.a}\nupper_boundary = ${s.b}\n${s.enabled ? 'window_open = True\n' : ''}\nwhile True:\n    print(f"Room: {room_temp}°C")\n    if room_temp < heat_below:\n        print("Heating ON")\n        room_temp += 2\n    elif room_temp >= upper_boundary:\n        print("Boiler OFF")\n        room_temp -= 1\n    else:\n        print("Standby mode")\n        room_temp -= 1${s.enabled ? '\n    if window_open:\n        room_temp -= 1' : ''}\n    time.sleep(1.2)`;
      break;
    case 6:
      p1 = `moisture = ${num('moisture', 40)}\n${s.enabled ? 'tank_empty = True\n' : ''}\nif moisture < ${s.a}${s.enabled ? ' and not tank_empty' : ''}:\n    moisture = 60\n    print("Watering complete")\n${s.enabled ? 'elif moisture < ' + s.a + ':\n    print("Refill tank")\n' : ''}else:\n    moisture = max(0, moisture - ${s.b})\nprint(moisture)`;
      p2 = `import time\n\ncurrent_moisture = ${num('moisture', 40)}\nwater_below = ${s.a}\ndrying_per_step = ${s.b}\n${s.enabled ? 'tank_empty = True\n' : ''}\nwhile True:\n    if current_moisture < water_below:\n${s.enabled ? '        if tank_empty:\n            print("Refill tank. Pump OFF")\n        else:\n            current_moisture = 60' : '        print("Pump ON")\n        current_moisture = 60'}\n    else:\n        current_moisture = max(0, current_moisture - drying_per_step)\n    print(f"Moisture: {current_moisture}%")\n    time.sleep(1)`;
      break;
    case 7:
      p1 = `price = ${s.a.toFixed(2)}\nstock = ${num('stock', s.b)}\nbalance = ${num('balance', 0)}\n\nif balance >= price and stock > 0:\n    print("Snack dispensed!")\n    print(f"Change: €{balance - price:.2f}")\nelse:\n    print("Out of stock" if stock == 0 else "Insert more coins")`;
      p2 = `price = ${s.a.toFixed(2)}\nstock = ${s.b}\nbalance = 0.0\nmetal_check = ${pyBool(!s.enabled)}\ninserted_coins = ${typeof v.coins === 'string' ? v.coins : '[]'}\n\n# Each item stores (value, is_metal)\nfor coin, is_metal in inserted_coins:\n    if stock == 0:\n        print("Out of stock. Coin returned")\n        break\n    if metal_check and not is_metal:\n        print("Ice coin rejected")\n        continue\n    balance = round(balance + coin, 2)\n    print(f"Balance: €{balance:.2f}")\n    if balance >= price:\n        stock -= 1\n        print("Snack dispensed!")\n        print(f"Change: €{balance - price:.2f}")\n        break`;
      break;
    case 8:
      p1 = `seconds_open = ${num('seconds', 0)}\ndoor_sensor_open = ${bool('sensed')}\n${s.enabled ? 'muted = True\n' : ''}\nif door_sensor_open and seconds_open > ${s.a}${s.enabled ? ' and not muted' : ''}:\n    print("BEEP BEEP BEEP!")\nelse:\n    print("Buzzer quiet")`;
      p2 = `import time\n\nalarm_after = ${s.a}\nfridge_temp = ${s.b}\nseconds_open = ${num('seconds', 0)}\ndoor_open = ${bool('open')}\nmagnet = ${bool('magnet')}\n${s.enabled ? 'muted = True\n' : ''}\nwhile door_open and not magnet:\n    time.sleep(1)\n    seconds_open += 1\n    fridge_temp = ${s.b} + seconds_open * 0.2\n    print(f"Door open: {seconds_open}s, temperature: {fridge_temp:.1f}°C")\n    if seconds_open > alarm_after${s.enabled ? ' and not muted' : ''}:\n        print("BEEP BEEP BEEP!")`;
      break;
    case 9:
      p1 = `sunlight = ${num('sunlight', 100)}\n${s.enabled ? `motion_detected = ${bool('motion')}\n` : ''}\nif sunlight < ${s.a}${s.enabled ? ' and motion_detected' : ''}:\n    print("Lamp brightness: ${s.b}%")\nelse:\n    print("Streetlights OFF")`;
      p2 = `darkness_threshold = ${s.a}\nlamp_brightness = ${s.b}\n\ndef update_lights(sunlight, motion=False):\n    dark = sunlight < darkness_threshold\n    if dark${s.enabled ? ' and motion' : ''}:\n        print(f"Streetlights ON: {lamp_brightness}%")\n        return lamp_brightness\n    print("Streetlights OFF")\n    return 0\n\nupdate_lights(${num('sunlight', 100)}, motion=${bool('motion')})`;
      break;
  }
  return { p1, p2 };
}
