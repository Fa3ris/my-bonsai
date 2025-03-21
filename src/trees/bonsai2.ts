import { line } from "../draw/line";
import { Cell, Growable, Point } from "../types";
import { cyrb128, sfc32 } from "../random";

type BranchParams = {
  start: Point;
  end: Point;
  width: number;
  layer: number;
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

// angle relative to the vertical axis
// trigo direction
function endPoint(
  start: Point,
  { length, angle }: { length: number; angle: number },
  { width, height }: { width: number; height: number }
): Point {
  return {
    x: Math.max(
      0,
      Math.min(width, start.x - Math.round(length * Math.sin(angle)))
    ),
    y: Math.max(
      0,
      Math.min(height, start.y + Math.round(length * Math.cos(angle)))
    ),
  };
}

function degToRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export class Bonsai2 implements Growable {
  private list: (Cell | Cell[])[] = [];

  private readonly bounds = { width: this.width - 1, height: this.height - 1 };

  constructor(private width: number, private height: number) {}

  growAll(): void {
    const branches: BranchParams[] = [];

    const root = { x: Math.round(this.width / 2), y: 1 };
    const length = 1;
    const angle = degToRad(0);
    const rootEnd = endPoint(root, { length, angle }, this.bounds);
    const rootBranch = {
      start: root,
      end: rootEnd,
      layer: 0,
      width: 1,
      length,
      angle,
      cells: branchCells(root, rootEnd),
    };

    branches.push(rootBranch);

    while (branches.length > 0) {
      const branch = branches.shift()!;

      const cellsToDisplay = branch.cells.splice(0, randInt(2, 4));
      if (cellsToDisplay.length > 0) {
        this.list.push(cellsToDisplay);
      }

      if (branch.cells.length > 0) {
        branches.unshift(branch);
        continue;
      }

      const maxLayer = 5;
      const newLayer = Math.min(maxLayer, branch.layer + 1);
      if (newLayer >= maxLayer) continue;

      const numberBranches = randInt(2, 3);

      const angleGen = angleGenerator(randInt(30, 45), numberBranches);

      for (let i = 0; i < numberBranches; i++) {
        const newLength = randInt(4, 8) - branch.layer;
        const newAngle = branch.angle + degToRad(angleGen.next().value!);
        const newEnd = endPoint(
          branch.end,
          {
            length: newLength,
            angle: newAngle,
          },
          this.bounds
        );

        const newBranch = {
          start: branch.end,
          end: newEnd,
          width: 1,
          length: newLength,
          layer: branch.layer + 1,
          angle: newAngle,
          cells: branchCells(branch.end, newEnd),
        };
        branches.push(newBranch);
      }
    }
  }

  step(i: number) {
    if (i < 0 || i > this.list.length) return;
    return this.list[i];
  }
}

const directions = [
  { dx: 0, dy: 1 },
  { dx: 0, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
] as const;

function branchCells(start: Point, end: Point): Cell[] {
  const points: Point[] = line(start, end);

  // points are not necessarily ordered from start to end
  if (points[0].x !== start.x && points[0].y !== start.y) {
    points.reverse();
  }

  const cells = points.map((p) => ({ ...p, char: "*" }));
  const leafCells = leavesAround(points);
  cells.push(...leafCells);

  return cells;
}

function leavesAround(points: Point[], char = "&"): Cell[] {
  const leaves = [];
  const validLeavesPositions = validLeavesPositionsAround(points, 2);
  const numLeaves = Math.min(10, validLeavesPositions.length);
  for (let i = 0; i < numLeaves; i++) {
    const leafIndex = randInt(0, validLeavesPositions.length - 1);
    const [leaf] = validLeavesPositions.splice(leafIndex, 1);
    leaves.push({ ...leaf, char });
  }
  return leaves;
}

function validLeavesPositionsAround(cells: Point[], offset: number) {
  const emptyCellsAround = cells
    .slice(offset, cells.length - offset)
    .flatMap((cell) => {
      const newCells = directions
        .map((direction) => ({
          x: cell.x + direction.dx,
          y: cell.y + direction.dy,
        }))
        .filter(
          (newCell) =>
            !cells.some((cell) => cell.x === newCell.x && cell.y === newCell.y)
        );
      return newCells;
    });

  emptyCellsAround.sort((a, b) => {
    const diffX = a.x - b.x;
    if (diffX !== 0) return diffX;
    return a.y - b.y;
  });

  const dedupedEmptyCells = emptyCellsAround.filter(
    (cell, i) =>
      i === 0 ||
      cell.x !== emptyCellsAround[i - 1].x ||
      cell.y !== emptyCellsAround[i - 1].y
  );
  return dedupedEmptyCells;
}

function* angleGenerator(totalAngle: number, parts: number) {
  let sign = randInt(0, 1) === 0 ? 1 : -1;
  const fraction = totalAngle / parts;
  let angle = fraction;
  while (true) {
    yield sign * angle;
    angle += fraction;
    sign *= -1;
  }
}