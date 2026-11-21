import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";

const PIECE_VALUE: Record<PieceSymbol, number> = {
  p: 100,
  n: 315,
  b: 330,
  r: 500,
  q: 900,
  k: 20_000,
};

function valueOf(piece: PieceSymbol | undefined) {
  return piece ? PIECE_VALUE[piece] : 0;
}

function applyMove(game: Chess, move: Move) {
  const play: { from: Square; to: Square; promotion?: PieceSymbol } = {
    from: move.from,
    to: move.to,
  };
  if (move.promotion) play.promotion = move.promotion;
  return game.move(play);
}

/** A small, single-level opponent: prefer captures, safe central moves, and check. */
export function chooseComputerMove(fen: string, random: () => number = Math.random): Move | null {
  const game = new Chess(fen);
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  const ranked = legalMoves.map((move) => {
    const branch = new Chess(fen);
    applyMove(branch, move);

    const file = move.to.charCodeAt(0) - 97;
    const rank = Number(move.to[1]) - 1;
    const centerBonus = (3.5 - Math.abs(file - 3.5) + 3.5 - Math.abs(rank - 3.5)) * 5;
    const directRisk = branch
      .moves({ verbose: true })
      .filter((reply) => reply.to === move.to && reply.captured)
      .reduce((highest, reply) => Math.max(highest, valueOf(reply.captured)), 0);

    const score =
      valueOf(move.captured) * 1.25 +
      (move.promotion ? valueOf(move.promotion) : 0) +
      centerBonus +
      (branch.isCheck() ? 24 : 0) +
      (branch.isCheckmate() ? 100_000 : 0) -
      directRisk * 0.72;

    return { move, score };
  });

  const bestScore = Math.max(...ranked.map((entry) => entry.score));
  const goodMoves = ranked.filter((entry) => entry.score >= bestScore - 45);
  const choice = goodMoves[Math.floor(random() * goodMoves.length)];
  return choice?.move ?? legalMoves[0] ?? null;
}
