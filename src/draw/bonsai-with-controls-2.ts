import { join } from "path";
import { Grid } from "../Grid";
import { TrunkTree } from "../trees/trunk";

const blank = " ";

type Step =
  | { x: number; y: number; char: string }
  | { x: number; y: number; char: string }[]
  | undefined;

export type Growable = {
  growAll(): void;
  step(i: number): Step;
};

const getTreeDefault = (width: number, height: number) =>
  new TrunkTree(width, height);

class BonsaiState {
  private step = 0;
  private grid: Grid;
  private tree: Growable;

  constructor(
    width: number,
    height: number,
    getTree: (width: number, height: number) => Growable
  ) {
    this.grid = new Grid(width, height);
    this.tree = getTree(width, height);
    this.tree.growAll();
  }

  forward(): boolean {
    const toDraw = this.tree.step(this.step);
    if (toDraw === undefined) {
      return false;
    }

    if (Array.isArray(toDraw)) {
      for (const { x, y, char } of toDraw) {
        this.grid.set(x, y, char);
      }
    } else {
      const { x, y, char } = toDraw;
      this.grid.set(x, y, char);
    }

    this.step++;
    return true;
  }

  backward(): void {
    if (this.step <= 0) {
      return;
    }
    this.step--;

    const toErase = this.tree.step(this.step);
    if (toErase === undefined) {
      return;
    }

    if (Array.isArray(toErase)) {
      for (const { x, y } of toErase) {
        this.grid.set(x, y, blank);
      }
    } else {
      this.grid.set(toErase.x, toErase.y, blank);
    }
  }

  reset(): void {
    this.step = 0;
    this.grid.reset();
  }

  getStep(): number {
    return this.step;
  }

  getGridValue(): string {
    return this.grid.toString();
  }
}

export function bonsaiWithControls2(
  getTree: (width: number, height: number) => Growable = getTreeDefault
) {
  const raster = document.createElement("textarea");
  const width = 80;
  const height = 20;
  raster.cols = width;
  raster.rows = height;
  document.body.append(raster);

  const advance = document.createElement("button");
  advance.textContent = "advance";
  advance.addEventListener("mousedown", () => {
    forward();
    intervalId = setInterval(forward, refreshInterval);
  });
  advance.addEventListener("mouseup", () => {
    clearInterval(intervalId);
  });
  advance.addEventListener("mouseleave", () => {
    clearInterval(intervalId);
  });

  const back = document.createElement("button");
  back.textContent = "back";
  back.addEventListener("mousedown", () => {
    backward();
    intervalId = setInterval(backward, refreshInterval);
  });

  back.addEventListener("mouseup", () => {
    clearInterval(intervalId);
  });

  back.addEventListener("mouseleave", () => {
    clearInterval(intervalId);
  });

  const reset = document.createElement("button");
  reset.textContent = "reset";
  reset.addEventListener("click", () => {
    resetState();
  });

  const end = document.createElement("button");
  end.textContent = "end";
  end.addEventListener("click", () => {
    while (bonsaiState.forward()) {}
    raster.value = bonsaiState.getGridValue();
  });

  const play = document.createElement("button");
  play.textContent = "play";
  play.addEventListener("click", () => {
    forward();
    intervalId = setInterval(forward, refreshInterval);
  });

  const pause = document.createElement("button");
  pause.textContent = "pause";
  pause.addEventListener("click", () => {
    clearInterval(intervalId);
  });

  const loop = document.createElement("button");
  loop.textContent = "loop";
  loop.addEventListener("click", () => {
    const next = initLoop();
    next();
    intervalId = setInterval(next, refreshInterval);
  });
  const bonsaiState = new BonsaiState(width, height, getTree);

  const stepSpan = document.createElement("div");
  drawStep();

  [advance, back, reset, end, play, pause, loop, stepSpan].forEach((el) => {
    document.body.append(el);
  });

  function drawStep() {
    stepSpan.textContent = `step ${bonsaiState.getStep()}`;
  }

  let intervalId: NodeJS.Timeout;
  const refreshInterval = 50;

  function draw() {
    drawStep();
    raster.value = bonsaiState.getGridValue();
  }

  function forward() {
    bonsaiState.forward() ? draw() : resetState();
  }

  function backward() {
    bonsaiState.backward();
    draw();
  }

  function resetState() {
    bonsaiState.reset();
    draw();
  }

  function initLoop() {
    function createIdle(duration: number) {
      let i = 0;
      return () => {
        if (++i <= duration) return;
        resetState();
        return forward;
      };
    }

    function forward() {
      return bonsaiState.forward() ? draw() : createIdle(10);
    }

    type Update = () => void | Update;
    let update: Update = forward;

    return () => {
      const newUpdate = update();
      if (newUpdate) {
        update = newUpdate;
      }
    };
  }
}
