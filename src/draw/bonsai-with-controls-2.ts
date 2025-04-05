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

  backward(): boolean {
    if (this.step <= 0) {
      return false;
    }
    this.step--;

    const toErase = this.tree.step(this.step);
    if (toErase === undefined) {
      return false;
    }

    if (Array.isArray(toErase)) {
      for (const { x, y } of toErase) {
        this.grid.set(x, y, blank);
      }
    } else {
      this.grid.set(toErase.x, toErase.y, blank);
    }
    return true;
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
  advance.addEventListener("mousedown", playInterval(forward));

  let intervalId: NodeJS.Timeout;
  const refreshInterval = 50;
  const loopIdleDuration = 10;
  function pauseInterval() {
    clearInterval(intervalId);
  }

  function playInterval(callback: () => void) {
    return () => {
      pauseInterval();
      callback();
      intervalId = setInterval(callback, refreshInterval);
    };
  }

  advance.addEventListener("mouseup", pauseInterval);
  advance.addEventListener("mouseleave", pauseInterval);

  const back = document.createElement("button");
  back.textContent = "back";
  back.addEventListener("mousedown", playInterval(backwardState));

  back.addEventListener("mouseup", pauseInterval);

  back.addEventListener("mouseleave", pauseInterval);

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
  play.addEventListener("click", playInterval(forward));

  const pause = document.createElement("button");
  pause.textContent = "pause";
  pause.addEventListener("click", pauseInterval);

  const loop = document.createElement("button");
  loop.textContent = "loop";
  loop.addEventListener("click", playInterval(initLoopState()));

  const save = document.createElement("button");
  save.textContent = "save";
  save.addEventListener("click", () => {
    const content = raster.value;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bonsai.txt";
    a.click();
    URL.revokeObjectURL(a.href); // Clean up the URL object
  });
  const bonsaiState = new BonsaiState(width, height, getTree);

  const step = document.createElement("div");
  drawStep();

  [advance, back, reset, end, play, pause, loop, save, step].forEach((el) => {
    document.body.append(el);
  });

  function drawStep() {
    step.textContent = `step ${bonsaiState.getStep()}`;
  }

  function draw() {
    drawStep();
    raster.value = bonsaiState.getGridValue();
  }

  function forward() {
    if (forwardState()) return;
    pauseInterval();
  }

  function forwardState() {
    const canForward = bonsaiState.forward();
    if (canForward) draw();
    return canForward;
  }

  function backwardState() {
    const canBackward = bonsaiState.backward();
    if (canBackward) draw();
    return canBackward;
  }

  function resetState() {
    bonsaiState.reset();
    draw();
  }

  function initLoopState() {
    function createIdle(duration: number) {
      let i = 0;
      return () => {
        if (++i <= duration) return;
        resetState();
        return forward;
      };
    }

    function forward() {
      return bonsaiState.forward() ? draw() : createIdle(loopIdleDuration);
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

  return {
    loop: playInterval(initLoopState()),
    end: () => {
      while (bonsaiState.forward()) {}
      raster.value = bonsaiState.getGridValue();
    },
  };
}
