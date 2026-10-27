(function attachSowStockfish(global) {
  "use strict";

  const VERSION = "Stockfish.js 19.0.1 Lite";

  function parseInfo(line) {
    const depth = line.match(/\bdepth (\d+)/);
    const centipawns = line.match(/\bscore cp (-?\d+)/);
    const mate = line.match(/\bscore mate (-?\d+)/);
    const principalVariation = line.match(/\bpv (.+)$/);
    if (!depth || (!centipawns && !mate)) return null;
    return {
      depth: Number(depth[1]),
      centipawns: centipawns ? Number(centipawns[1]) : null,
      mate: mate ? Number(mate[1]) : null,
      principalVariation: principalVariation ? principalVariation[1].trim().split(/\s+/) : [],
    };
  }

  function makeWorker() {
    const assets = global.SOW_STOCKFISH_ASSETS;
    if (!assets?.script || !assets?.wasm) {
      throw new Error("The local Stockfish bundle is missing. Run node build.js to create it.");
    }

    const prelude = `
      const sowStockfishWasm = Uint8Array.from(atob("${assets.wasm}"), (character) => character.charCodeAt(0));
      const sowNativeFetch = self.fetch.bind(self);
      self.fetch = async (input, options) => {
        if (String(input).includes(".wasm")) {
          return new Response(sowStockfishWasm.slice(), {
            status: 200,
            headers: { "Content-Type": "application/wasm" },
          });
        }
        return sowNativeFetch(input, options);
      };
    `;
    const source = Uint8Array.from(atob(assets.script), (character) => character.charCodeAt(0));
    const workerUrl = URL.createObjectURL(new Blob([prelude, source], { type: "text/javascript" }));
    try {
      const workerEntry = `${workerUrl}#stockfish-19-lite-single.wasm`;
      return { worker: new Worker(workerEntry, { name: "Sow Chess Stockfish" }), workerUrl };
    } catch (error) {
      URL.revokeObjectURL(workerUrl);
      throw error;
    }
  }

  class StockfishClient {
    constructor() {
      const { worker, workerUrl } = makeWorker();
      this.worker = worker;
      this.workerUrl = workerUrl;
      this.active = null;
      this.queued = null;
      this.isReady = false;
      this.closed = false;
      this.readyPromise = new Promise((resolve, reject) => {
        this.resolveReady = resolve;
        this.rejectReady = reject;
      });
      this.worker.onmessage = (event) => this.onMessage(String(event.data));
      this.worker.onerror = (event) => {
        const error = new Error(event.message || "Stockfish could not start in this browser.");
        if (!this.isReady) this.rejectReady(error);
        this.finishWithError(error);
      };
      this.worker.postMessage("uci");
    }

    onMessage(line) {
      if (line === "uciok") {
        this.worker.postMessage("isready");
        return;
      }
      if (line === "readyok") {
        this.isReady = true;
        this.resolveReady();
        URL.revokeObjectURL(this.workerUrl);
        this.workerUrl = "";
        this.startQueued();
        return;
      }
      if (line.startsWith("info ")) {
        const info = parseInfo(line);
        if (info && this.active) {
          this.active.latestInfo = info;
          this.active.onInfo?.(info);
        }
        return;
      }
      if (line.startsWith("bestmove ")) {
        const [bestmove] = line.split(/\s+/).slice(1);
        const request = this.active;
        this.active = null;
        if (request && !request.cancelled) {
          request.resolve({ bestmove, info: request.latestInfo });
        }
        this.startQueued();
      }
    }

    search(fen, depth = 13, onInfo) {
      if (this.closed) return Promise.reject(new Error("Stockfish has been stopped."));
      return new Promise((resolve, reject) => {
        const request = { fen, depth, onInfo, resolve, reject, latestInfo: null, cancelled: false };
        if (this.queued) this.queued.resolve(null);
        this.queued = request;
        if (this.active && !this.active.cancelled) {
          this.active.cancelled = true;
          this.active.resolve(null);
          this.worker.postMessage("stop");
        }
        this.readyPromise.then(() => this.startQueued(), reject);
      });
    }

    startQueued() {
      if (!this.isReady || this.active || !this.queued || this.closed) return;
      const request = this.queued;
      this.queued = null;
      this.active = request;
      this.worker.postMessage(`position fen ${request.fen}`);
      this.worker.postMessage(`go depth ${request.depth}`);
    }

    stop() {
      if (this.queued) this.queued.resolve(null);
      this.queued = null;
      if (this.active && !this.active.cancelled) {
        this.active.cancelled = true;
        this.active.resolve(null);
        this.worker.postMessage("stop");
      }
    }

    finishWithError(error) {
      if (this.queued) this.queued.reject(error);
      if (this.active) this.active.reject(error);
      this.queued = null;
      this.active = null;
    }

    terminate() {
      if (this.closed) return;
      this.closed = true;
      this.stop();
      this.worker.terminate();
      if (this.workerUrl) URL.revokeObjectURL(this.workerUrl);
    }
  }

  global.SowStockfish = Object.freeze({
    version: VERSION,
    create: () => new StockfishClient(),
  });
})(globalThis);
