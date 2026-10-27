(function startSowChessApp(global) {
  "use strict";

  const FILES = "abcdefgh";
  const PIECE_NAMES = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" };
  const PIECE_ORDER = { p: 1, n: 2, b: 3, r: 4, q: 5 };
  const SVG_NS = "http://www.w3.org/2000/svg";
  const PIECE_BOUNDS = {
    p: [14, 8, 86, 91], n: [13, 8, 87, 91], b: [15, 8, 85, 91],
    r: [13, 10, 87, 91], q: [9, 3, 91, 91], k: [13, 8, 87, 91],
  };
  const PIECE_ART = {
    p: [
      ["piece-body", "M50 8 A13 13 0 1 1 50 34 A13 13 0 1 1 50 8 Z"],
      ["piece-body", "M39 35 C38 48 35 57 31 66 L40 75 H60 L69 66 C65 57 62 48 61 35 Z"],
      ["piece-body", "M26 77 H74 L86 91 H14 Z"],
      ["piece-detail", "M37 72 H63 M20 85 H80"],
    ],
    n: [
      ["piece-body", "M22 74 C15 63 19 49 31 41 C38 36 49 33 53 25 C56 19 53 13 49 8 C66 10 82 21 85 38 C88 54 75 67 67 75 H79 L87 91 H13 L20 78 Z"],
      ["piece-detail", "M62 27 A2.8 2.8 0 1 1 61.99 27 M35 47 C44 44 51 39 55 33 M24 83 H80"],
    ],
    b: [
      ["piece-body", "M50 8 A11 11 0 1 1 50 30 A11 11 0 1 1 50 8 Z"],
      ["piece-body", "M43 21 C39 30 32 37 28 48 C23 60 30 68 39 73 L31 79 H69 L61 73 C70 68 77 60 72 48 C68 37 61 30 57 21 Z"],
      ["piece-body", "M26 80 H74 L85 91 H15 Z"],
      ["piece-detail", "M58 34 L42 54 M23 85 H77"],
    ],
    r: [
      ["piece-body", "M18 10 H34 V21 H43 V10 H57 V21 H66 V10 H82 V35 L75 42 V74 H25 V42 L18 35 Z"],
      ["piece-body", "M20 77 H80 L87 91 H13 Z"],
      ["piece-detail", "M21 34 H79 M29 44 V69 M71 44 V69 M22 84 H78"],
    ],
    q: [
      ["piece-body", "M14 4 A5 5 0 1 1 14 14 A5 5 0 1 1 14 4 Z M29 10 A5 5 0 1 1 29 20 A5 5 0 1 1 29 10 Z M50 3 A5 5 0 1 1 50 13 A5 5 0 1 1 50 3 Z M71 10 A5 5 0 1 1 71 20 A5 5 0 1 1 71 10 Z M86 4 A5 5 0 1 1 86 14 A5 5 0 1 1 86 4 Z"],
      ["piece-body", "M15 24 L34 44 L43 25 L50 47 L57 25 L66 44 L85 24 L76 74 H24 Z"],
      ["piece-body", "M21 77 H79 L87 91 H13 Z"],
      ["piece-detail", "M28 57 H72 M24 84 H76"],
    ],
    k: [
      ["piece-body", "M44 8 H56 V18 H67 V29 H56 V38 H44 V29 H33 V18 H44 Z"],
      ["piece-body", "M39 39 C35 49 29 58 29 68 C29 72 33 75 38 77 H62 C67 75 71 72 71 68 C71 58 65 49 61 39 Z"],
      ["piece-body", "M22 79 H78 L87 91 H13 Z"],
      ["piece-detail", "M34 68 H66 M24 85 H76"],
    ],
  };
  const STATUS_TEXT = {
    4: ["Draw by stalemate", "Neither king is in check, and no legal move remains."],
    5: ["Draw by the 50-move rule", "The position reached 100 half-moves without a pawn move or capture."],
    6: ["Draw by threefold repetition", "The same position has occurred three times."],
    7: ["Draw by insufficient material", "There is not enough material to checkmate."],
    10: ["Draw agreed", "Both players accepted the draw."],
  };

  const ui = {
    board: document.querySelector("#chessboard"),
    modeLabel: document.querySelector("#mode-label"),
    gameMode: document.querySelector("#game-mode"),
    toggleEngine: document.querySelector("#toggle-engine"),
    blackName: document.querySelector("#black-name"),
    blackDescription: document.querySelector("#black-description"),
    whiteName: document.querySelector("#white-name"),
    whiteDescription: document.querySelector("#white-description"),
    status: document.querySelector("#game-status"),
    detail: document.querySelector("#status-detail"),
    statusDot: document.querySelector("#status-dot"),
    moveCount: document.querySelector("#move-count"),
    moveTotal: document.querySelector("#move-total"),
    moveList: document.querySelector("#move-list"),
    emptyMoves: document.querySelector("#empty-moves"),
    whiteTurn: document.querySelector("#white-turn"),
    blackTurn: document.querySelector("#black-turn"),
    whitePlayer: document.querySelector("#white-player"),
    blackPlayer: document.querySelector("#black-player"),
    whiteCaptured: document.querySelector("#white-captured"),
    blackCaptured: document.querySelector("#black-captured"),
    undo: document.querySelector("#undo-move"),
    offerDraw: document.querySelector("#offer-draw"),
    resign: document.querySelector("#resign"),
    flip: document.querySelector("#flip-board"),
    copyPgn: document.querySelector("#copy-pgn"),
    newGame: document.querySelector("#new-game"),
    toast: document.querySelector("#toast"),
    promotionDialog: document.querySelector("#promotion-dialog"),
    promotionChoices: document.querySelector("#promotion-choices"),
    drawDialog: document.querySelector("#draw-dialog"),
    drawCopy: document.querySelector("#draw-copy"),
    positionDialog: document.querySelector("#position-dialog"),
    positionInput: document.querySelector("#position-fen"),
    positionHelp: document.querySelector("#position-help"),
    engineState: document.querySelector("#engine-state"),
    engineEvaluation: document.querySelector("#engine-evaluation"),
    engineLine: document.querySelector("#engine-line"),
    bestMove: document.querySelector("#best-move"),
    analyzePosition: document.querySelector("#analyze-position"),
    bestMoveHint: document.querySelector("#best-move-hint"),
  };

  let game = null;
  let orientation = "white";
  let selectedSquare = null;
  let selectedMoves = [];
  let pendingPromotion = null;
  let toastTimer = 0;
  let engineMode = false;
  let engineThinking = false;
  let stockfish = null;
  let engineTurnId = 0;
  let analysisRequestId = 0;
  let analysisResult = null;
  let hintMove = null;

  function fileOf(index) { return index % 8; }
  function rankOf(index) { return Math.floor(index / 8); }
  function colorName(side) { return side === 0 ? "White" : "Black"; }
  function pieceSide(piece) { return piece && piece === piece.toUpperCase() ? 0 : 1; }
  function coordinate(index) { return `${FILES[fileOf(index)]}${rankOf(index) + 1}`; }

  function createPieceIcon(piece) {
    const type = piece.toLowerCase();
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.classList.add("piece-svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("focusable", "false");
    const [left, top, right, bottom] = PIECE_BOUNDS[type];
    const scaleX = 76 / (right - left);
    const scaleY = 84 / (bottom - top);
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("transform", `translate(${12 - left * scaleX} ${8 - top * scaleY}) scale(${scaleX} ${scaleY})`);
    for (const [className, pathData] of PIECE_ART[type]) {
      const path = document.createElementNS(SVG_NS, "path");
      path.classList.add(className);
      path.setAttribute("d", pathData);
      group.append(path);
    }
    svg.append(group);
    return svg;
  }

  function parseUciMove(uci) {
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(uci || "")) return null;
    const from = (Number(uci[1]) - 1) * 8 + uci[0].toLowerCase().charCodeAt(0) - 97;
    const to = (Number(uci[3]) - 1) * 8 + uci[2].toLowerCase().charCodeAt(0) - 97;
    return { from, to, promotion: uci[4] ? uci[4].toUpperCase().charCodeAt(0) : 0 };
  }

  function formatUciMove(uci) {
    const move = parseUciMove(uci);
    if (!move) return uci;
    const promotion = move.promotion ? `=${String.fromCharCode(move.promotion)}` : "";
    return `${coordinate(move.from)} → ${coordinate(move.to)}${promotion}`;
  }

  function formatPrincipalVariation(moves, fen) {
    const fields = fen.split(" ");
    let side = fields[1] === "b" ? 1 : 0;
    let moveNumber = Number(fields[5]) || 1;
    return moves.slice(0, 7).map((move) => {
      const prefix = side === 0 ? `${moveNumber}. ` : `${moveNumber}… `;
      if (side === 1) moveNumber += 1;
      side = 1 - side;
      return prefix + formatUciMove(move);
    }).join(" · ");
  }

  function formatEvaluation(info, fen) {
    const whitePerspective = fen.split(" ")[1] === "b" ? -1 : 1;
    if (info.mate !== null) {
      const mate = info.mate * whitePerspective;
      return `${mate < 0 ? "−" : ""}M${Math.abs(mate)}`;
    }
    const pawns = (info.centipawns * whitePerspective) / 100;
    return `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
  }

  function clearAnalysis(stopSearch = true) {
    analysisRequestId += 1;
    analysisResult = null;
    hintMove = null;
    ui.engineEvaluation.textContent = "—";
    ui.engineLine.textContent = "Analyze the current position to see Stockfish’s top line.";
    ui.bestMove.textContent = "Best move hint will appear here.";
    ui.bestMove.classList.remove("has-move");
    ui.engineState.textContent = "Ready";
    ui.engineState.classList.remove("busy");
    ui.analyzePosition.textContent = "Analyze position";
    ui.bestMoveHint.textContent = "Best move hint";
    ui.bestMoveHint.setAttribute("aria-pressed", "false");
    if (stopSearch) stockfish?.stop();
  }

  function currentAnalysisIsValid() {
    return analysisResult && game && analysisResult.fen === game.fen();
  }

  function renderAnalysisInfo(info, fen) {
    if (!info) return;
    ui.engineEvaluation.textContent = formatEvaluation(info, fen);
    ui.engineState.textContent = `Depth ${info.depth}`;
    ui.engineState.classList.add("busy");
    const line = formatPrincipalVariation(info.principalVariation, fen);
    ui.engineLine.textContent = line ? `Top line · ${line}` : "Stockfish is evaluating the position.";
  }

  function showBestMoveHint() {
    if (!currentAnalysisIsValid() || !analysisResult.move) return false;
    hintMove = analysisResult.move;
    ui.bestMove.textContent = `Best move · ${formatUciMove(analysisResult.bestmove)}`;
    ui.bestMove.classList.add("has-move");
    ui.bestMoveHint.textContent = "Hide hint";
    ui.bestMoveHint.setAttribute("aria-pressed", "true");
    renderBoard();
    return true;
  }

  async function runAnalysis(showHint = false, force = false) {
    if (!game || game.status() >= 2 || engineThinking) return;
    const fen = game.fen();
    if (currentAnalysisIsValid() && !force) {
      if (showHint) showBestMoveHint();
      return;
    }

    const requestId = ++analysisRequestId;
    ui.engineState.textContent = "Starting…";
    ui.engineState.classList.add("busy");
    ui.engineLine.textContent = "Stockfish is searching this position.";
    ui.bestMove.textContent = "The best move will appear when analysis finishes.";
    ui.bestMove.classList.remove("has-move");
    ui.analyzePosition.disabled = true;
    ui.bestMoveHint.disabled = true;

    try {
      stockfish ??= global.SowStockfish.create();
      const result = await stockfish.search(fen, 13, (info) => {
        if (requestId === analysisRequestId && game?.fen() === fen) renderAnalysisInfo(info, fen);
      });
      if (!result || requestId !== analysisRequestId || game?.fen() !== fen) return;

      const move = parseUciMove(result.bestmove);
      const legal = move && game.legalMoves(move.from).some((candidate) =>
        candidate.to === move.to && (candidate.promotion || 0) === move.promotion);
      analysisResult = { fen, bestmove: result.bestmove, info: result.info, move: legal ? move : null };
      if (result.info) renderAnalysisInfo(result.info, fen);
      else ui.engineLine.textContent = "Stockfish finished without a principal variation.";
      ui.engineState.textContent = "Analysis ready";
      ui.engineState.classList.remove("busy");
      ui.analyzePosition.textContent = "Analyze again";
      if (analysisResult.move) {
        ui.bestMove.textContent = `Best move · ${formatUciMove(result.bestmove)}`;
        ui.bestMove.classList.add("has-move");
        if (showHint) showBestMoveHint();
      } else {
        ui.bestMove.textContent = "No best move is available in this position.";
      }
    } catch (error) {
      if (requestId !== analysisRequestId) return;
      ui.engineState.textContent = "Unavailable";
      ui.engineState.classList.remove("busy");
      ui.engineLine.textContent = error.message || "Stockfish could not start in this browser.";
      setToast("Stockfish could not start. Check the browser’s WebAssembly support.");
      stockfish?.terminate();
      stockfish = null;
    } finally {
      if (requestId === analysisRequestId) {
        ui.analyzePosition.disabled = game?.status() >= 2 || engineThinking;
        ui.bestMoveHint.disabled = game?.status() >= 2 || engineThinking;
      }
    }
  }

  function setToast(message) {
    global.clearTimeout(toastTimer);
    ui.toast.textContent = message;
    ui.toast.classList.add("visible");
    toastTimer = global.setTimeout(() => ui.toast.classList.remove("visible"), 2600);
  }

  function addCoordinate(element, className, value) {
    const label = document.createElement("span");
    label.className = `coordinate ${className}`;
    label.setAttribute("aria-hidden", "true");
    label.textContent = value;
    element.append(label);
  }

  function renderBoard() {
    if (!game) return;
    const focused = ui.board.contains(document.activeElement)
      ? Number(document.activeElement.dataset.square)
      : null;
    const pieces = game.board();
    const last = game.lastMove();
    const side = game.sideToMove();
    const checkSquare = game.isCheck() ? pieces.findIndex((piece) => piece === (side === 0 ? "K" : "k")) : -1;
    const legalTargets = new Map(selectedMoves.map((move) => [move.to, move]));
    ui.board.replaceChildren();
    ui.board.setAttribute("aria-label", `Chessboard, ${colorName(side)} to move, ${orientation} at the bottom`);

    for (let row = 0; row < 8; row += 1) {
      const rowElement = document.createElement("div");
      rowElement.className = "board-rank";
      rowElement.setAttribute("role", "row");
      for (let column = 0; column < 8; column += 1) {
        const rank = orientation === "white" ? 7 - row : row;
        const file = orientation === "white" ? column : 7 - column;
        const index = rank * 8 + file;
        const piece = pieces[index];
        const square = document.createElement("button");
        const isLight = (file + rank) % 2 === 1;
        square.type = "button";
        square.className = `square ${isLight ? "light" : "dark"}`;
        square.dataset.square = String(index);
        square.setAttribute("role", "gridcell");
        square.setAttribute("aria-rowindex", String(row + 1));
        square.setAttribute("aria-colindex", String(column + 1));
        square.setAttribute("aria-label", `${coordinate(index)}${piece ? `, ${pieceSide(piece) === 0 ? "white" : "black"} ${PIECE_NAMES[piece.toLowerCase()]}` : ", empty"}`);

        if (index === last.from || index === last.to) square.classList.add("last-move");
        if (index === selectedSquare) square.classList.add("selected");
        if (index === checkSquare) square.classList.add("in-check");
        if (hintMove?.from === index) square.classList.add("hint-from");
        if (hintMove?.to === index) square.classList.add("hint-to");
        if (legalTargets.has(index)) {
          const target = legalTargets.get(index);
          if (pieces[index] && pieceSide(pieces[index]) !== side) square.classList.add("legal-capture");
          else square.classList.add("legal-target");
          square.dataset.legalPromotion = target.promotion ? String.fromCharCode(target.promotion) : "";
        }

        if (piece) {
          const glyph = document.createElement("span");
          glyph.className = `piece ${pieceSide(piece) === 1 ? "black-piece" : "white-piece"}`;
          glyph.setAttribute("aria-hidden", "true");
          glyph.append(createPieceIcon(piece));
          square.append(glyph);
        }

        const rankEdge = orientation === "white" ? column === 0 : column === 7;
        const fileEdge = orientation === "white" ? row === 7 : row === 0;
        if (rankEdge) addCoordinate(square, "rank-coordinate", String(rank + 1));
        if (fileEdge) addCoordinate(square, "file-coordinate", FILES[file]);
        rowElement.append(square);
      }
      ui.board.append(rowElement);
    }

    if (focused !== null) ui.board.querySelector(`[data-square="${focused}"]`)?.focus({ preventScroll: true });
  }

  function renderMoves(entries) {
    ui.moveList.replaceChildren();
    if (entries.length === 0) {
      ui.moveList.append(ui.emptyMoves.cloneNode(true));
      return;
    }

    const rows = new Map();
    entries.forEach((entry, index) => {
      let row = rows.get(entry.number);
      if (!row) {
        row = document.createElement("div");
        row.className = "move-row";
        row.setAttribute("role", "listitem");
        const number = document.createElement("span");
        number.className = "move-number";
        number.textContent = entry.side === 1 && index === 0 ? `${entry.number}…` : `${entry.number}.`;
        row.append(number);
        for (let side = 0; side < 2; side += 1) {
          const san = document.createElement("span");
          san.className = "move-san";
          san.dataset.side = String(side);
          row.append(san);
        }
        rows.set(entry.number, row);
      }
      const san = row.querySelector(`[data-side="${entry.side}"]`);
      san.textContent = entry.san;
      san.setAttribute("aria-label", `${colorName(entry.side)}: ${entry.san}`);
      if (index === entries.length - 1) san.classList.add("current");
      ui.moveList.append(row);
    });
  }

  function renderCaptured(entries) {
    const captured = [[], []];
    for (const entry of entries) {
      if (!entry.captured) continue;
      captured[entry.side].push(String.fromCharCode(entry.captured));
    }

    for (const side of [0, 1]) {
      const pieces = captured[side].sort((a, b) => PIECE_ORDER[a.toLowerCase()] - PIECE_ORDER[b.toLowerCase()]);
      const target = side === 0 ? ui.whiteCaptured : ui.blackCaptured;
      target.replaceChildren();
      for (const piece of pieces) {
        const glyph = document.createElement("span");
        glyph.setAttribute("aria-hidden", "true");
        glyph.textContent = game.pieces[piece];
        target.append(glyph);
      }
      target.setAttribute("aria-label", `${colorName(side)} captured: ${pieces.length ? pieces.map((piece) => PIECE_NAMES[piece.toLowerCase()]).join(", ") : "none"}`);
    }
  }

  function renderStatus(status) {
    const turn = game.sideToMove();
    const reason = game.endReason();
    let title = `${colorName(turn)} to move`;
    let detail = "It's your turn.";
    let tone = "";

    if (status === 0) {
      detail = game.history().length === 0 ? "Make your opening move." : `${colorName(turn)} to play.`;
    } else if (status === 1) {
      title = `${colorName(turn)} is in check`;
      detail = "Find a legal move to protect your king.";
      tone = "warning";
    } else if (status === 2 || status === 3) {
      const winner = status === 2 ? "White" : "Black";
      title = `${winner} wins`;
      detail = reason === 1 ? "White resigned. The game is over." :
        reason === 2 ? "Black resigned. The game is over." : "Checkmate. The game is over.";
      tone = "finished";
    } else if (STATUS_TEXT[status]) {
      [title, detail] = STATUS_TEXT[status];
      tone = "finished";
    }

    if (engineMode && turn === 1 && status < 2) {
      title = engineThinking ? "Stockfish is thinking" : "Stockfish to move";
      detail = engineThinking ? "The local engine is searching this position." : "Stockfish plays Black.";
    }

    ui.status.textContent = title;
    ui.detail.textContent = detail;
    ui.statusDot.className = `status-dot ${tone}`;
    ui.whiteTurn.classList.toggle("active", status < 2 && turn === 0);
    ui.blackTurn.classList.toggle("active", status < 2 && turn === 1);
    ui.whitePlayer.classList.toggle("is-active", status < 2 && turn === 0);
    ui.blackPlayer.classList.toggle("is-active", status < 2 && turn === 1);
    ui.whiteTurn.setAttribute("aria-label", status < 2 && turn === 0 ? "White to move" : "White not to move");
    ui.blackTurn.setAttribute("aria-label", status < 2 && turn === 1 ? "Black to move" : "Black not to move");

    const modeText = engineMode ? "Play vs Stockfish" : "Pass & Play";
    ui.modeLabel.textContent = engineMode ? "VS STOCKFISH" : "PASS & PLAY";
    ui.modeLabel.setAttribute("aria-label", `Game mode: ${modeText}`);
    ui.gameMode.textContent = modeText;
    ui.blackName.textContent = engineMode ? "Stockfish" : "Black";
    ui.blackDescription.textContent = engineMode ? "Local chess engine" : "Playing locally";
    ui.whiteName.textContent = engineMode ? "You · White" : "White";
    ui.whiteDescription.textContent = engineMode ? "Your side" : "You";
    ui.toggleEngine.setAttribute("aria-pressed", String(engineMode));
    ui.toggleEngine.title = engineMode ? "Switch to pass and play" : "Play against Stockfish as White";
    ui.toggleEngine.firstElementChild.textContent = engineMode ? "♙" : "♟";
    ui.toggleEngine.lastChild.textContent = engineMode ? " Switch to Pass & Play" : " Play vs Stockfish";
  }

  function renderAll() {
    if (!game) return;
    const entries = game.history();
    const status = game.status();
    renderBoard();
    renderMoves(entries);
    renderCaptured(entries);
    renderStatus(status);
    ui.moveCount.textContent = String(Math.ceil(entries.length / 2));
    ui.moveTotal.textContent = String(entries.length);
    ui.undo.disabled = !game.canUndo();
    ui.offerDraw.disabled = status >= 2 || engineMode;
    ui.resign.disabled = status >= 2;
    ui.analyzePosition.disabled = status >= 2 || engineThinking;
    ui.bestMoveHint.disabled = status >= 2 || engineThinking;
  }

  function clearSelection() {
    selectedSquare = null;
    selectedMoves = [];
  }

  function chooseSquare(index) {
    if (!game || game.status() >= 2 || engineThinking || (engineMode && game.sideToMove() === 1)) return;
    const piece = game.pieceAt(index);
    if (!piece || pieceSide(piece) !== game.sideToMove()) {
      clearSelection();
      renderBoard();
      return;
    }
    selectedSquare = index;
    selectedMoves = game.legalMoves(index);
    renderBoard();
  }

  function showPromotion(from, to) {
    pendingPromotion = { from, to };
    const side = game.sideToMove();
    const options = ["Q", "R", "B", "N"];
    ui.promotionChoices.replaceChildren();
    for (const promotion of options) {
      const piece = side === 0 ? promotion : promotion.toLowerCase();
      const button = document.createElement("button");
      button.type = "button";
      button.className = "promotion-choice";
      button.dataset.promotion = promotion;
      button.setAttribute("aria-label", `Promote to ${PIECE_NAMES[promotion.toLowerCase()]}`);
      button.textContent = game.pieces[piece];
      ui.promotionChoices.append(button);
    }
    ui.promotionDialog.showModal();
  }

  function finishMove(from, to, promotion = 0) {
    const result = game.playMove(from, to, promotion);
    if (result !== 1) {
      if (result === -2) setToast("The game is over. Start a new game to play again.");
      else setToast("That move is not legal.");
      return false;
    }
    clearSelection();
    clearAnalysis();
    renderAll();
    if (engineMode && game.sideToMove() === 1) requestEngineMove();
    return true;
  }

  async function requestEngineMove() {
    if (!game || !engineMode || game.status() >= 2 || game.sideToMove() !== 1) return;
    clearSelection();
    clearAnalysis();
    const turnId = ++engineTurnId;
    const fen = game.fen();
    engineThinking = true;
    ui.engineState.textContent = "Starting…";
    ui.engineState.classList.add("busy");
    renderAll();

    try {
      stockfish ??= global.SowStockfish.create();
      const result = await stockfish.search(fen, 14, (info) => {
        if (turnId === engineTurnId && game?.fen() === fen) renderAnalysisInfo(info, fen);
      });
      if (!result || turnId !== engineTurnId || !engineMode || game?.fen() !== fen) return;

      const move = parseUciMove(result.bestmove);
      const legal = move && game.legalMoves(move.from).some((candidate) =>
        candidate.to === move.to && (candidate.promotion || 0) === move.promotion);
      if (!legal || game.playMove(move.from, move.to, move.promotion) !== 1) {
        throw new Error("Stockfish returned a move that is not legal in this position.");
      }

      engineThinking = false;
      clearSelection();
      clearAnalysis(false);
      renderAll();
      setToast("Stockfish played.");
    } catch (error) {
      if (turnId !== engineTurnId) return;
      engineThinking = false;
      engineMode = false;
      clearSelection();
      clearAnalysis(false);
      stockfish?.terminate();
      stockfish = null;
      renderAll();
      ui.engineState.textContent = "Unavailable";
      ui.engineLine.textContent = error.message || "Stockfish could not start in this browser.";
      setToast("Stockfish could not start. Pass & Play is ready instead.");
    } finally {
      if (turnId === engineTurnId && engineThinking) {
        engineThinking = false;
        renderAll();
      }
    }
  }

  function handleBoardClick(event) {
    const square = event.target.closest(".square");
    if (!square || !game || engineThinking || (engineMode && game.sideToMove() === 1)) return;
    const target = Number(square.dataset.square);
    if (selectedSquare !== null) {
      const candidates = selectedMoves.filter((move) => move.to === target);
      if (candidates.length) {
        if (candidates.some((move) => move.promotion)) showPromotion(selectedSquare, target);
        else finishMove(selectedSquare, target);
        return;
      }
    }
    if (target === selectedSquare) {
      clearSelection();
      renderBoard();
      return;
    }
    chooseSquare(target);
  }

  async function copyText(text, successMessage) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setToast(successMessage);
        return;
      }
    } catch {
      /* Local file pages may not receive clipboard permission; try the browser fallback. */
    }

    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.className = "copy-fallback";
    document.body.append(field);
    field.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch { copied = false; }
    field.remove();
    if (copied) setToast(successMessage);
    else setToast("Copy is unavailable here. Select the text in the position window to copy it.");
  }

  function onPromotionChoice(event) {
    const button = event.target.closest("[data-promotion]");
    if (!button || !pendingPromotion) return;
    const { from, to } = pendingPromotion;
    const promotion = button.dataset.promotion.charCodeAt(0);
    pendingPromotion = null;
    ui.promotionDialog.close();
    finishMove(from, to, promotion);
  }

  ui.board.addEventListener("click", handleBoardClick);
  ui.board.addEventListener("keydown", (event) => {
    const square = event.target.closest(".square");
    if (!square) return;
    const visualIndex = Array.from(ui.board.querySelectorAll(".square")).indexOf(square);
    const keyDelta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 }[event.key];
    if (keyDelta === undefined) return;
    const column = visualIndex % 8;
    const next = visualIndex + keyDelta;
    if ((event.key === "ArrowLeft" && column === 0) || (event.key === "ArrowRight" && column === 7) || next < 0 || next >= 64) return;
    event.preventDefault();
    ui.board.querySelectorAll(".square")[next]?.focus();
  });

  ui.newGame.addEventListener("click", () => {
    if (!game) return;
    if (game.history().length && !global.confirm("Start a new game? The current game will be cleared.")) return;
    engineTurnId += 1;
    engineThinking = false;
    clearAnalysis();
    game.reset();
    clearSelection();
    renderAll();
    setToast("A new game is ready.");
  });

  ui.undo.addEventListener("click", () => {
    if (!game) return;
    engineTurnId += 1;
    engineThinking = false;
    clearAnalysis();
    if (!game.undo()) return;
    if (engineMode && game.sideToMove() === 1) game.undo();
    clearSelection();
    renderAll();
    setToast("Last move undone.");
  });

  ui.toggleEngine.addEventListener("click", () => {
    if (!game) return;
    engineTurnId += 1;
    engineThinking = false;
    engineMode = !engineMode;
    clearAnalysis();
    renderAll();
    if (engineMode) {
      setToast("You play White. Stockfish plays Black.");
      if (game.sideToMove() === 1 && game.status() < 2) requestEngineMove();
    } else {
      setToast("Pass & Play is ready.");
    }
  });

  ui.analyzePosition.addEventListener("click", () => runAnalysis(false, true));
  ui.bestMoveHint.addEventListener("click", () => {
    if (!currentAnalysisIsValid()) {
      runAnalysis(true);
      return;
    }
    if (hintMove) {
      hintMove = null;
      ui.bestMoveHint.textContent = "Best move hint";
      ui.bestMoveHint.setAttribute("aria-pressed", "false");
      renderBoard();
      return;
    }
    showBestMoveHint();
  });

  ui.flip.addEventListener("click", () => {
    orientation = orientation === "white" ? "black" : "white";
    renderBoard();
  });

  ui.copyPgn.addEventListener("click", () => {
    if (game) copyText(game.pgn(), "PGN copied to clipboard.");
  });

  document.querySelector("#open-position").addEventListener("click", () => {
    if (!game) return;
    ui.positionInput.value = game.fen();
    ui.positionHelp.textContent = "Copy the current position or enter a valid FEN to set up a new game.";
    ui.positionHelp.classList.remove("error-text");
    ui.positionDialog.showModal();
  });

  document.querySelector("#copy-fen").addEventListener("click", () => {
    copyText(ui.positionInput.value.trim(), "FEN copied to clipboard.");
  });

  document.querySelector("#load-fen").addEventListener("click", () => {
    if (!game) return;
    if (game.history().length && !global.confirm("Load this position and clear the current game?")) return;
    if (!game.loadFen(ui.positionInput.value.trim())) {
      ui.positionHelp.textContent = "That FEN is not valid. Check the board, side to move, castling, en passant, and move counters.";
      ui.positionHelp.classList.add("error-text");
      return;
    }
    engineTurnId += 1;
    engineThinking = false;
    clearAnalysis();
    clearSelection();
    orientation = "white";
    ui.positionDialog.close();
    renderAll();
    setToast("Position loaded.");
    if (engineMode && game.sideToMove() === 1 && game.status() < 2) requestEngineMove();
  });

  ui.offerDraw.addEventListener("click", () => {
    if (!game || game.status() >= 2) return;
    ui.drawCopy.textContent = `${colorName(game.sideToMove())} offers a draw. Pass the device to the other player to respond.`;
    ui.drawDialog.showModal();
  });

  document.querySelector("#decline-draw").addEventListener("click", () => {
    ui.drawDialog.close();
    setToast("Draw offer declined.");
  });

  document.querySelector("#accept-draw").addEventListener("click", () => {
    if (game?.agreeDraw()) {
      ui.drawDialog.close();
      clearSelection();
      renderAll();
    }
  });

  ui.resign.addEventListener("click", () => {
    if (!game || game.status() >= 2) return;
    const side = colorName(game.sideToMove());
    if (!global.confirm(`${side} resigns. End the game?`)) return;
    if (game.resign()) {
      engineTurnId += 1;
      engineThinking = false;
      clearAnalysis();
      clearSelection();
      renderAll();
    }
  });

  ui.promotionChoices.addEventListener("click", onPromotionChoice);
  ui.promotionDialog.addEventListener("close", () => { pendingPromotion = null; });

  async function boot() {
    ui.status.textContent = "Loading chess rules…";
    ui.detail.textContent = "Preparing the local game.";
    try {
      game = await global.SowChess.createEngine();
      if (!game.reset()) throw new Error("Could not initialize a standard chess position.");
      renderAll();
    } catch (error) {
      ui.status.textContent = "Chess engine unavailable";
      ui.detail.textContent = error.message || "Build the C WebAssembly engine to start playing.";
      ui.statusDot.classList.add("warning");
      ui.board.setAttribute("aria-label", "Chessboard unavailable until the C engine is built");
      setToast("Run node build.js after installing Zig 0.17.0.");
      console.error(error);
    }
  }

  boot();
})(globalThis);
