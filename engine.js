(function attachSowChessEngine(global) {
  "use strict";

  const PIECES = Object.freeze({
    P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕", K: "♔",
    p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
  });

  async function createEngine() {
    if (!global.SOW_CHESS_WASM_BINARY) {
      throw new Error("The compiled chess engine is missing. Run node build.js first.");
    }

    const { instance } = await WebAssembly.instantiate(global.SOW_CHESS_WASM_BINARY, {});
    const engine = instance.exports;
    if (!engine.memory || !engine.chess_text_buffer || !engine.chess_input_buffer || !engine.chess_move_buffer) {
      throw new Error("The compiled chess engine has an incompatible WebAssembly interface.");
    }
    const textPointer = engine.chess_text_buffer();
    const inputPointer = engine.chess_input_buffer();
    const movesPointer = engine.chess_move_buffer();
    const textDecoder = new TextDecoder();
    const textEncoder = new TextEncoder();

    function readText(pointer, capacity = 131072) {
      const bytes = new Uint8Array(engine.memory.buffer, pointer, capacity);
      let length = 0;
      while (length < capacity && bytes[length] !== 0) length += 1;
      return textDecoder.decode(bytes.subarray(0, length));
    }

    function writeInput(value) {
      const bytes = textEncoder.encode(value);
      if (bytes.length >= 256) return false;
      const memory = new Uint8Array(engine.memory.buffer);
      memory.fill(0, inputPointer, inputPointer + 256);
      memory.set(bytes, inputPointer);
      return true;
    }

    function copyText(functionName, capacity) {
      engine[functionName](textPointer, capacity);
      return readText(textPointer, capacity);
    }

    function history() {
      const count = engine.chess_history_count();
      const result = [];
      for (let index = 0; index < count; index += 1) {
        engine.chess_history_san(index, textPointer, 32);
        result.push({
          san: readText(textPointer, 32),
          captured: engine.chess_history_capture(index),
          side: engine.chess_history_side(index),
          number: engine.chess_history_number(index),
        });
      }
      return result;
    }

    function legalMoves(from) {
      const count = engine.chess_legal_moves(from, movesPointer, 64);
      const words = new Int32Array(engine.memory.buffer, movesPointer, count * 2);
      const moves = [];
      for (let index = 0; index < count; index += 1) {
        moves.push({ to: words[index * 2], promotion: words[index * 2 + 1] || 0 });
      }
      return moves;
    }

    function board() {
      return Array.from({ length: 64 }, (_, index) => {
        const code = engine.chess_piece_at(index);
        return code ? String.fromCharCode(code) : "";
      });
    }

    return Object.freeze({
      pieces: PIECES,
      reset: () => engine.chess_reset() === 1,
      loadFen: (fen) => writeInput(fen) && engine.chess_load_fen(inputPointer) === 1,
      pieceAt: (square) => {
        const code = engine.chess_piece_at(square);
        return code ? String.fromCharCode(code) : "";
      },
      board,
      sideToMove: () => engine.chess_side_to_move(),
      lastMove: () => ({
        from: engine.chess_last_move_from(),
        to: engine.chess_last_move_to(),
      }),
      isCheck: () => engine.chess_is_check() === 1,
      status: () => engine.chess_current_status(),
      legalMoves,
      playMove: (from, to, promotion = 0) => engine.chess_play_move(from, to, promotion),
      undo: () => engine.chess_undo() === 1,
      canUndo: () => engine.chess_can_undo() === 1,
      history,
      fen: () => copyText("chess_copy_fen", 128),
      pgn: () => copyText("chess_copy_pgn", 131072),
      resign: () => engine.chess_resign() === 1,
      agreeDraw: () => engine.chess_agree_draw() === 1,
      endReason: () => engine.chess_end_reason(),
    });
  }

  global.SowChess = Object.freeze({ createEngine });
})(globalThis);
