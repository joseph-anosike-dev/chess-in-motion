import { Chess, type Move, type Piece, type PieceSymbol, type Square } from "chess.js";
import { Bot, Crown, RotateCcw, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { chooseComputerMove } from "@/lib/chess-ai";
import { ChessPiece } from "./ChessPiece";

const STARTING_FEN = new Chess().fen();
const FILES = "abcdefgh";
const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

interface AnimatedMove {
  from: Square;
  to: Square;
  piece: Piece;
}

function makeMove(game: Chess, from: Square, to: Square) {
  const movingPiece = game.get(from);
  if (!movingPiece) return null;
  try {
    const move = game.move({ from, to, promotion: "q" });
    return { move, movingPiece };
  } catch {
    return null;
  }
}

export function ChessGame() {
  const [fen, setFen] = useState(STARTING_FEN);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [animation, setAnimation] = useState<AnimatedMove | null>(null);
  const [thinking, setThinking] = useState(false);
  const game = useMemo(() => new Chess(fen), [fen]);
  const legalMoves = useMemo(() => game.moves({ verbose: true }), [game]);
  const selectedMoves = selectedSquare
    ? legalMoves.filter((move) => move.from === selectedSquare)
    : [];
  const isGameOver = game.isGameOver();

  useEffect(() => {
    if (!animation) return;
    const timeout = window.setTimeout(() => setAnimation(null), 320);
    return () => window.clearTimeout(timeout);
  }, [animation]);

  useEffect(() => {
    if (game.turn() !== "b" || game.isGameOver()) {
      setThinking(false);
      return;
    }

    setThinking(true);
    const timeout = window.setTimeout(() => {
      const computerGame = new Chess(fen);
      const choice = chooseComputerMove(fen);
      if (choice) {
        const result = makeMove(computerGame, choice.from, choice.to);
        if (result) {
          setAnimation({ from: result.move.from, to: result.move.to, piece: result.movingPiece });
          setLastMove({ from: result.move.from, to: result.move.to });
          setMoves((current) => [...current, result.move]);
          setFen(computerGame.fen());
        }
      }
      setThinking(false);
    }, 560);

    return () => window.clearTimeout(timeout);
  }, [fen, game]);

  function playMove(from: Square, to: Square) {
    const nextGame = new Chess(fen);
    const result = makeMove(nextGame, from, to);
    if (!result) return false;

    setAnimation({ from, to, piece: result.movingPiece });
    setLastMove({ from, to });
    setMoves((current) => [...current, result.move]);
    setSelectedSquare(null);
    setFen(nextGame.fen());
    return true;
  }

  function onSquareClick(square: Square) {
    if (thinking || isGameOver || game.turn() !== "w") return;

    const isLegalDestination = selectedMoves.some((move) => move.to === square);
    if (selectedSquare && isLegalDestination) {
      playMove(selectedSquare, square);
      return;
    }

    const clickedPiece = game.get(square);
    if (clickedPiece?.color === "w") {
      setSelectedSquare(selectedSquare === square ? null : square);
      return;
    }
    setSelectedSquare(null);
  }

  function startNewGame() {
    setFen(STARTING_FEN);
    setSelectedSquare(null);
    setLastMove(null);
    setMoves([]);
    setAnimation(null);
    setThinking(false);
  }

  const isCheckmate = game.isCheckmate();
  const gameResult = isCheckmate
    ? game.turn() === "w"
      ? "Computer wins"
      : "You win"
    : game.isDraw()
      ? "Draw game"
      : null;
  const status = gameResult
    ? gameResult
    : game.isCheck()
      ? game.turn() === "w"
        ? "You are in check"
        : "Computer is in check"
      : thinking
        ? "Computer is thinking"
        : game.turn() === "w"
          ? "Your move"
          : "Computer to move";
  const currentMove = Math.floor(moves.length / 2) + 1;
  const displayedMoves = Array.from({ length: Math.ceil(moves.length / 2) }, (_, index) => ({
    number: index + 1,
    white: moves[index * 2],
    black: moves[index * 2 + 1],
  }));

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen w-full max-w-[1320px] flex-col px-4 pb-8 pt-5 sm:px-7 sm:pt-7 lg:px-10">
        <header className="mb-7 flex items-center justify-between gap-4 border-b border-border/80 pb-5 sm:mb-9">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-card text-primary">
              <Crown aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="font-serif text-xl font-semibold leading-none">Open File</p>
              <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                A game of chess
              </p>
            </div>
          </div>
          <Button
            onClick={startNewGame}
            variant="outline"
            className="h-10 shrink-0 gap-2 border-border bg-transparent px-3 text-foreground hover:bg-accent sm:px-4"
          >
            <RotateCcw aria-hidden="true" />
            <span>New game</span>
          </Button>
        </header>

        <section className="grid flex-1 items-start gap-8 lg:grid-cols-[minmax(0,660px)_minmax(260px,320px)] lg:justify-center lg:gap-12">
          <div className="mx-auto w-full max-w-[660px]">
            <PlayerLine
              icon="computer"
              name="Computer"
              detail="Black · Casual"
              active={game.turn() === "b" && !isGameOver}
              thinking={thinking}
            />

            <div className="mt-3 rounded-lg border border-board-edge bg-board-edge p-2.5 shadow-[0_18px_55px_-30px_var(--board-edge)] sm:p-3.5">
              <div className="relative aspect-square overflow-hidden rounded-[3px]">
                <div className="grid h-full grid-cols-8 grid-rows-8">
                  {Array.from({ length: 8 }, (_, rowIndex) => {
                    const rank = 8 - rowIndex;
                    return Array.from(FILES, (file, fileIndex) => {
                      const square = `${file}${rank}` as Square;
                      const piece = game.get(square);
                      const isLight = (fileIndex + rank) % 2 === 0;
                      const isSelected = selectedSquare === square;
                      const isLegalDestination = selectedMoves.some((move) => move.to === square);
                      const isCapture = selectedMoves.some(
                        (move) => move.to === square && (move.captured || move.flags.includes("e")),
                      );
                      const isLastMove = lastMove?.from === square || lastMove?.to === square;
                      const isAnimatedLanding = animation?.to === square;

                      return (
                        <Button
                          key={square}
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`${square}, ${piece ? `${piece.color === "w" ? "white" : "black"} ${PIECE_NAMES[piece.type]}` : "empty"}`}
                          aria-pressed={isSelected}
                          onClick={() => onSquareClick(square)}
                          className={`relative isolate grid h-full w-full aspect-square place-items-center overflow-hidden rounded-none p-0 text-inherit shadow-none hover:bg-transparent focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${isLight ? "bg-board-light" : "bg-board-dark"} ${isSelected ? "ring-2 ring-inset ring-board-highlight" : ""} ${isLastMove ? "after:pointer-events-none after:absolute after:inset-0 after:bg-board-highlight/35 after:content-['']" : ""}`}
                        >
                          {piece && !isAnimatedLanding && (
                            <ChessPiece type={piece.type} color={piece.color} />
                          )}
                          {isLegalDestination && !piece && (
                            <span
                              aria-hidden="true"
                              className="absolute z-[1] size-[20%] rounded-full bg-board-marker/45"
                            />
                          )}
                          {isLegalDestination && piece && isCapture && (
                            <span
                              aria-hidden="true"
                              className="absolute inset-[5%] rounded-full border-[3px] border-board-capture"
                            />
                          )}
                          {fileIndex === 0 && (
                            <span
                              className={`pointer-events-none absolute left-1 top-0.5 z-[3] text-[10px] font-semibold leading-none sm:left-1.5 sm:top-1 sm:text-xs ${isLight ? "text-board-dark" : "text-board-light"}`}
                            >
                              {rank}
                            </span>
                          )}
                          {rank === 1 && (
                            <span
                              className={`pointer-events-none absolute bottom-0.5 right-1 z-[3] text-[10px] font-semibold leading-none sm:bottom-1 sm:right-1.5 sm:text-xs ${isLight ? "text-board-dark" : "text-board-light"}`}
                            >
                              {file}
                            </span>
                          )}
                        </Button>
                      );
                    });
                  })}
                </div>

                {animation && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-20 grid grid-cols-8 grid-rows-8"
                  >
                    <div
                      className="piece-flight grid aspect-square place-items-center"
                      style={
                        {
                          gridColumnStart: FILES.indexOf(animation.from[0] ?? "a") + 1,
                          gridRowStart: 8 - Number(animation.from[1]),
                          "--move-x": `${(animation.to.charCodeAt(0) - animation.from.charCodeAt(0)) * 100}%`,
                          "--move-y": `${(Number(animation.from[1]) - Number(animation.to[1])) * 100}%`,
                        } as React.CSSProperties
                      }
                    >
                      <ChessPiece type={animation.piece.type} color={animation.piece.color} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <PlayerLine
              icon="player"
              name="You"
              detail="White · Player"
              active={game.turn() === "w" && !isGameOver}
              thinking={false}
            />
          </div>

          <aside className="flex w-full flex-col pt-1 lg:pt-0">
            <div className="border-b border-border/80 pb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Single player
              </p>
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <h1 className="font-serif text-3xl font-medium leading-tight">Open File</h1>
                  <p className="mt-2 text-sm text-muted-foreground">You versus the computer</p>
                </div>
                <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                  <Bot aria-hidden="true" className="size-3.5" />
                  Casual
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-b border-border/80 py-5">
              <div className="flex items-center gap-3">
                <span
                  className={`size-2 rounded-full ${game.turn() === "w" && !isGameOver ? "bg-primary" : "bg-muted-foreground/45"}`}
                />
                <div aria-live="polite">
                  <p className="text-sm font-semibold">{status}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {moves.length === 0
                      ? "The board is ready"
                      : `${moves.length} ${moves.length === 1 ? "move" : "moves"} played`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Move
                </p>
                <p className="mt-0.5 font-mono text-lg tabular-nums">
                  {String(currentMove).padStart(2, "0")}
                </p>
              </div>
            </div>

            <div className="pt-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Moves</h2>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {moves.length}
                </span>
              </div>
              <div className="max-h-[360px] overflow-y-auto border-y border-border/80">
                {displayedMoves.length > 0 ? (
                  <div className="divide-y divide-border/70">
                    {displayedMoves.map((entry) => (
                      <div
                        key={entry.number}
                        className={`grid grid-cols-[42px_1fr_1fr] items-center gap-3 py-2.5 font-mono text-sm tabular-nums ${entry.number === currentMove ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        <span className="text-xs">{String(entry.number).padStart(2, "0")}</span>
                        <span>{entry.white?.san ?? "—"}</span>
                        <span>{entry.black?.san ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-7 text-center text-sm text-muted-foreground">No moves yet</div>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <Crown aria-hidden="true" className="size-3.5 text-primary" />
              {isGameOver
                ? "Game complete"
                : game.turn() === "w"
                  ? "White to play"
                  : "Black to play"}
              <span className="text-border">·</span>
              Standard chess
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function PlayerLine({
  icon,
  name,
  detail,
  active,
  thinking,
}: {
  icon: "computer" | "player";
  name: string;
  detail: string;
  active: boolean;
  thinking: boolean;
}) {
  const Icon = icon === "computer" ? Bot : UserRound;
  return (
    <div
      className={`flex min-h-[58px] items-center justify-between gap-3 px-1 ${icon === "computer" ? "pb-1" : "pt-3"}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-full border ${active ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold">{name}</p>
            {active && <span className="size-1.5 rounded-full bg-primary" />}
            {thinking && <span className="text-[11px] text-muted-foreground">Thinking…</span>}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
      {icon === "computer" && (
        <span className="shrink-0 rounded-sm border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          AI
        </span>
      )}
    </div>
  );
}
