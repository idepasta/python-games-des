import { useEffect, useState } from "react";
import { SCORE_EVENT } from "@/lib/auth/scoring";
import { findUser } from "@/lib/auth/store";

export function ScoreBadge({ username }: { username: string }) {
  const [score, setScore] = useState(0);
  useEffect(() => {
    const read = () => setScore(findUser(username)?.score ?? 0);
    read();
    window.addEventListener(SCORE_EVENT, read);
    return () => window.removeEventListener(SCORE_EVENT, read);
  }, [username]);

  return (
    <div
      className="fixed right-4 top-3 z-40 rounded-full border-[3px] border-foreground bg-warn px-4 py-1 font-display text-lg font-bold text-foreground shadow"
      aria-label={`Score ${score}`}
    >
      ⭐ {score}
    </div>
  );
}
