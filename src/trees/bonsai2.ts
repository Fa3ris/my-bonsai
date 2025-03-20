import { line } from "../draw/line";
import { Cell, Growable, Point } from "../types";
import { cyrb128, sfc32 } from "../random";

type BranchParams = {
  start: Point;
  end: Point;
  width: number;
  length: number;
  angle: number;
  cells: Cell[];
};

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

export class Bonsai2 implements Growable {
  private list: (Cell | Cell[])[] = [];

  constructor(private width: number, private height: number) {}

  growAll(): void {
    const branches: BranchParams[] = [];

    const seedX = Math.round(this.width / 2);
    const seedY = 1;

    const points: Point[] = line(
      { x: seedX, y: seedY },
      { x: seedX, y: seedY + 10 }
    );

    const cells = points.map((p) => ({ ...p, char: "*" }));

    const variations = [
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: -1 },
    ];

    const leaves = [];

    const emptyCells = cells.slice(2, cells.length - 2).flatMap((cell) => {
      const newCells = variations
        .map((v) => ({
          x: cell.x + v.dx,
          y: cell.y + v.dy,
        }))
        .filter(
          (newCell) =>
            !cells.some((cell) => cell.x === newCell.x && cell.y === newCell.y)
        );
      return newCells;
    });

    emptyCells.sort((a, b) => {
      const diffX = a.x - b.x;
      if (diffX !== 0) {
        return diffX;
      }
      return a.y - b.y;
    });

    const dedupedEmptyCells = emptyCells.filter(
      (cell, i) =>
        i === 0 ||
        cell.x !== emptyCells[i - 1].x ||
        cell.y !== emptyCells[i - 1].y
    );

    const numLeaves = Math.min(10, dedupedEmptyCells.length);
    for (let i = 0; i < numLeaves; i++) {
      const pos = randInt(0, dedupedEmptyCells.length - 1);
      const [leaf] = dedupedEmptyCells.splice(pos, 1);
      leaves.push({ ...leaf, char: "&" });
    }

    cells.push(...leaves);

    branches.push({
      start: { x: seedX, y: seedY },
      end: { x: seedX, y: seedY + 11 },
      width: 1,
      length: 1,
      angle: 0,
      cells,
    });

    while (branches.length > 0) {
      const branch = branches.shift()!;

      // display part of the branch
      const oneStep = branch.cells.splice(0, randInt(2, 4));
      if (oneStep.length > 0) {
        this.list.push(oneStep);
      }

      // branch still has cells to display
      if (branch.cells.length > 0) {
        branches.push(branch);
      }
    }
  }

  step(i: number) {
    if (i < 0 || i > this.list.length) return;
    return this.list[i];
  }
}
