import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";

import { chooseComputerMove } from "@/lib/chess-ai";

describe("computer chess opponent", () => {
  it("chooses a legal move from the available moves", () => {
    const game = new Chess();
    game.move("e4");

    const choice = chooseComputerMove(game.fen(), () => 0);

    expect(choice).not.toBeNull();
    if (!choice) throw new Error("Expected the computer to choose a move.");
    expect(
      game
        .moves({ verbose: true })
        .some((move) => move.from === choice.from && move.to === choice.to),
    ).toBe(true);
  });

  it("returns no move when the game is already over", () => {
    const checkmate = new Chess("7k/6Q1/5K2/8/8/8/8/8 b - - 0 1");

    expect(checkmate.isCheckmate()).toBe(true);
    expect(chooseComputerMove(checkmate.fen())).toBeNull();
  });
});
