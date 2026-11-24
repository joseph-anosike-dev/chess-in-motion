import type { PieceSymbol } from "chess.js";

const pieceNames: Record<PieceSymbol, string> = {
  p: "Lieutenant / Platoon (pawn)",
  n: "Captain (knight)",
  b: "Captain (bishop)",
  r: "Major (rook)",
  q: "Lt Col (queen)",
  k: "Colonel (king)",
};

export function ChessPiece({ type, color }: { type: PieceSymbol; color: "w" | "b" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className={`relative z-[2] !size-[78%] ${color === "w" ? "piece-light" : "piece-dark"}`}
      role="img"
      focusable="false"
    >
      <title>{`${color === "w" ? "White" : "Black"} ${pieceNames[type]}`}</title>
      <g strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round">
        {type === "p" && (
          <>
            <circle cx="32" cy="14" r="7" />
            <path d="M25 25c0-3 3-5 7-5s7 2 7 5c0 3-2 5-4 6l3 14h5l4 7H17l4-7h5l3-14c-2-1-4-3-4-6Z" />
          </>
        )}
        {type === "r" && (
          <path d="M15 12h8v8h6v-8h7v8h6v-8h8v17H15V12Zm5 18h24l3 19H17l3-19Zm-7 20h38l3 7H10l3-7Z" />
        )}
        {type === "n" && (
          <>
            <path d="M14 53h39l-4-8-9-4 6-12-4-12-13-7-6 8-10 5-4 15 8 8-3 7Z" />
            <path d="m20 30 8-5 1-8m7 6h.1" fill="none" stroke="currentColor" />
            <circle cx="37" cy="23" r="2" className="fill-primary stroke-primary" />
          </>
        )}
        {type === "b" && (
          <>
            <path d="M32 8c-8 0-13 6-13 13 0 6 4 9 8 12l-3 14h16l-3-14c4-3 8-6 8-12 0-7-5-13-13-13Zm-8 39h16l4 5H20l4-5Zm-8 5h32l4 7H12l4-7Z" />
            <path d="m38 14-12 15" fill="none" stroke="currentColor" strokeWidth="3" />
          </>
        )}
        {type === "q" && (
          <>
            <circle cx="14" cy="14" r="4" />
            <circle cx="26" cy="9" r="4" />
            <circle cx="38" cy="9" r="4" />
            <circle cx="50" cy="14" r="4" />
            <path d="m14 19 5 27h26l5-27-11 12-7-17-7 17-11-12Zm5 27h26l4 6H15l4-6Zm-8 6h42l3 6H8l3-6Z" />
          </>
        )}
        {type === "k" && (
          <>
            <path d="M28 8h8v8h8v7h-8v8c6 3 10 9 10 17H18c0-8 4-14 10-17v-8h-8v-7h8V8Z" />
            <path d="M21 48h22l4 5H17l4-5Zm-9 5h40l3 6H9l3-6Z" />
          </>
        )}
      </g>
    </svg>
  );
}
