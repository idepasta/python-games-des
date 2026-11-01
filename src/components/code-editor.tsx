type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export function CodeEditor({ value, onChange, label = "Code editor" }: CodeEditorProps) {
  const lines = Math.max(12, value.split("\n").length);
  return (
    <div className="flex h-full min-h-[280px] overflow-hidden rounded-xl border-2 border-foreground/20 bg-code font-mono text-sm text-code-foreground">
      <div aria-hidden className="select-none bg-background/10 px-2 py-3 text-right text-xs leading-6 text-code-foreground/50">
        {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
      </div>
      <textarea
        aria-label={label}
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-h-[280px] w-full resize-none bg-transparent p-3 leading-6 outline-none"
      />
    </div>
  );
}
