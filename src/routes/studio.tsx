import { createFileRoute, Link } from "@tanstack/react-router";
import { CodingStudio } from "@/components/coding-studio";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Phone Game Studio — Python Mini-Games" },
      { name: "description", content: "Split-screen coding missions with live phone previews, including checkers, othello, and a platformer." },
      { property: "og:title", content: "Phone Game Studio — Python Mini-Games" },
      { property: "og:description", content: "Build Mad Libs, an ASCII decoder, Checkers, Rock Paper Scissors, Guess the Number, and Word Guess." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  return (
    <div>
      <div className="border-b border-foreground/20 bg-card px-4 py-2">
        <Link to="/" className="font-display text-sm font-bold hover:text-primary">← Code the World</Link>
      </div>
      <CodingStudio />
    </div>
  );
}
