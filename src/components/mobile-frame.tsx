import type { ReactNode } from "react";

export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[min(100%,280px)]">
      <div className="relative rounded-[2.2rem] border-[10px] border-foreground bg-foreground shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-foreground" />
        <div className="min-h-[500px] overflow-hidden rounded-[1.5rem] bg-card">
          {children}
        </div>
        <div className="mx-auto my-2 h-1.5 w-24 rounded-full bg-off/80" />
      </div>
    </div>
  );
}
