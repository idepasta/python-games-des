import { createContext, useContext, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { extraDefinitions, initialExtras, type ExtraSettings, type InputValues } from '@/lib/extras';

const ExtrasContext = createContext<{
  settings: ExtraSettings;
  inputs: InputValues;
  setInputs: (values: InputValues) => void;
} | null>(null);
export function useExtras() {
  const context = useContext(ExtrasContext);
  if (!context) throw new Error('Game needs an ExtrasProvider');
  return context;
}
export function ExtrasProvider({ n, children }: { n: number; children: (settings: ExtraSettings, inputs: InputValues) => ReactNode }) {
  const [settings, setSettings] = useState(() => initialExtras(n));
  const [inputs, setInputValues] = useState<InputValues>({});
  const definition = extraDefinitions[n];
  if (!definition) return null;
  return <ExtrasContext.Provider value={{ settings, inputs, setInputs: setInputValues }}>
    <section className="border-y-[3px] border-foreground py-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold">🧩 Extra functions</h3>
        <Button variant="outline" onClick={() => setSettings(initialExtras(n))}>Reset extras</Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {(['a', 'b'] as const).map(key => {
          const option = definition[key];
          return <label key={key} className="block">
            <div className="flex justify-between gap-3 font-display font-semibold"><span>{option.label}</span><output className="shrink-0">{settings[key]}{option.unit}</output></div>
            <input aria-label={option.label} className="w-full accent-primary" type="range" min={option.min} max={option.max} step={option.step} value={settings[key]} onChange={e => setSettings(s => ({ ...s, [key]: Number(e.target.value) }))} />
          </label>;
        })}
      </div>
      <label className="flex items-center gap-3 font-display font-semibold cursor-pointer">
        <input type="checkbox" className="size-5 accent-primary shrink-0" checked={settings.enabled} onChange={e => setSettings(s => ({ ...s, enabled: e.target.checked }))} />
        {definition.toggle}
      </label>
    </section>
    {children(settings, inputs)}
  </ExtrasContext.Provider>;
}
