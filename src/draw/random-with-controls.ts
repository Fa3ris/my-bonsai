import { Grid } from "../Grid";
import { RandTree } from "../trees/randtree";

const blank = " ";

export function randomTreeWithControls() {
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

  const tree = new RandTree(width, height);
  tree.growAll();
  const grid = new Grid(width, height);

  let step = 0;

  let intervalId: number;
  const refreshInterval = 50;

  function forward() {
    const { x, y, c } = tree.step(step) || {};
    if (x === undefined) {
      return;
    }

    grid.set(x, y, c);
    step++;
    el.value = grid.toString();
  }

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
    const { x, y } = tree.step(step) || {};
    if (x === undefined) {
      return;
    }

    grid.set(x, y, blank);
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
}
