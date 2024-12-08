import { Grid } from "../Grid";
import { TrunkTree } from "../trees/trunk";

const blank = " ";

export function bonsaiWithControls() {
  const el = document.createElement("textarea");
  const width = 80;
  const height = 20;
  el.cols = width;
  el.rows = height;
  document.body.append(el);

  const advance = document.createElement("button");
  advance.textContent = "advance";

  document.body.append(advance);

  const back = document.createElement("button");
  back.textContent = "back";

  document.body.append(back);
  const reset = document.createElement("button");
  reset.textContent = "reset";

  document.body.append(reset);
  const tree = new TrunkTree(width, height);
  tree.growAll();
  const grid = new Grid(width, height);

  let step = 0;

  let intervalId: number;
  const refreshInterval = 50;

  function forward() {
    const toDraw = tree.step(step);
    if (toDraw === undefined) {
      return false;
    }

    if (Array.isArray(toDraw)) {
      for (const d of toDraw) {
        const { x, y, char } = d;
        grid.set(x, y, char);
      }
    } else {
      const { x, y, char } = toDraw;
      grid.set(x, y, char);
    }

    step++;
    el.value = grid.toString();
    return true;
  }

  while (forward()) {}

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

  function backward() {
    if (step <= 0) {
      return;
    }
    step--;

    const toErase = tree.step(step);
    if (toErase === undefined) {
      return;
    }

    if (Array.isArray(toErase)) {
      for (const e of toErase) {
        const { x, y } = e;
        grid.set(x, y, blank);
      }
    } else {
      grid.set(toErase.x, toErase.y, blank);
    }

    el.value = grid.toString();
  }

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

  reset.addEventListener("click", () => {
    step = 0;
    grid.reset();
    el.value = grid.toString();
  });
}
