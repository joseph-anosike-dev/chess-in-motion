import { createFileRoute } from "@tanstack/react-router";
import { ChessGame } from "@/components/chess-game/ChessGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Open File — Single-player chess" },
      { name: "description", content: "Play a relaxed game of chess against a computer opponent." },
      { property: "og:title", content: "Open File — Single-player chess" },
      {
        property: "og:description",
        content: "Play a relaxed game of chess against a computer opponent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <ChessGame />;
}
