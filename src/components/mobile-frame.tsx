import type { ReactNode } from "react";

export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto h-full w-full max-w-[420px]">
      <div className="relative flex h-full min-h-[560px] flex-col rounded-[2rem] border-[10px] border-[#16161a] bg-gradient-to-b from-[#3a3a40] to-[#121214] shadow-[0_24px_40px_rgba(0,0,0,0.28),inset_0_0_0_1px_rgba(255,255,255,0.16)]">
        <div className="absolute -left-[14px] top-24 h-10 w-1 rounded-l bg-[#2c2c31]" />
        <div className="absolute -left-[14px] top-40 h-16 w-1 rounded-l bg-[#2c2c31]" />
        <div className="absolute -right-[14px] top-32 h-20 w-1 rounded-r bg-[#2c2c31]" />
        <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.4rem] bg-[#070b14]">
          <div className="flex items-center justify-between px-5 pb-1 pt-3 text-xs font-semibold tracking-wide text-white/80">
            <span>9:41</span>
            <span className="flex items-center gap-2">
              <span>5G</span>
              <span className="inline-block h-3 w-6 rounded-sm border border-white/70 p-px">
                <span className="block h-full w-2/3 rounded-[1px] bg-white" />
              </span>
            </span>
          </div>
          {children}
        </div>
        <div className="mx-auto my-2 h-1 w-24 rounded-full bg-white/35" />
      </div>
    </div>
  );
}
