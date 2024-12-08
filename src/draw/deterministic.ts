import { Grid } from "../Grid";
import { cyrb128, sfc32 } from "../random";
import { DeterministicTree } from "../trees/deterministic";

const seed = cyrb128(String(new Date().getTime()));
const getRand = sfc32(seed[0], seed[1], seed[2], seed[3]);

/**
 *
 * @param {*} min inclusive
 * @param {*} max inclusive
 * @returns
 */
function randInt(min: number, max: number) {
  const minCeiled = Math.ceil(Math.min(min, max));
  const maxFloored = Math.floor(Math.max(min, max));
  return minCeiled + Math.floor(getRand() * (maxFloored - minCeiled + 1));
}

export function drawDeterministicTree() {
  const el = document.createElement("textarea");
  const width = 80;
  const height = 20;
  el.cols = width;
  el.rows = height;
  document.body.append(el);

  const tree = new DeterministicTree(width, height);

  const grid = new Grid(width, height);
  const { x, y, c } = tree.step(0)!;
  grid.set(x, y, c);

  const displayTree = (step: number) => {
    const { x, y, c, nextTime } = tree.step(step) || {};
    if (x === undefined) {
      return;
    }
    grid.set(x, y!, c!);

    setTimeout(() => {
      el.value = grid.toString();
      displayTree(step + 1);
    }, nextTime || randInt(100, 300));
  };

  el.value = grid.toString();

  displayTree(1);
}
