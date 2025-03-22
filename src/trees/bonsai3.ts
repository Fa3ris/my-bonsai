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

type NumberConfig =
  | number
  | [number, number]
  | ((branch: BranchParams) => number);

type StringConfig = string | string[] | ((branch: BranchParams) => string);

type Configuration = {
  root: {
    x: number;
    y: number;
    length: number;
    angle: number;
  };
  generateBranches: {
    number: NumberConfig;
    length: NumberConfig;
    angle: NumberConfig;
    leaves: NumberConfig;
    branchChar: StringConfig;
    leafChar: StringConfig;
  };
  displayCells: NumberConfig;
  maxLayer: number;
};

export class Bonsai3 implements Growable {
  private list: (Cell | Cell[])[] = [];

  private readonly bounds = { width: this.width - 1, height: this.height - 1 };

  constructor(
    private readonly width: number,
    private readonly height: number,
    private readonly configuration: Configuration
  ) {}

  growAll(): void {
    const branches: BranchParams[] = [];

    const root = { x: this.configuration.root.x, y: this.configuration.root.y };
    const length = this.configuration.root.length;
    const angle = this.configuration.root.angle;
    const rootEnd = endPoint(root, { length, angle }, this.bounds);

    const rootPoints = this.branchCells(root, rootEnd);
    const rootBranch: BranchParams = {
      start: root,
      end: rootEnd,
      layer: 0,
      width: 1,
      length,
      angle,
      cells: [],
    };

    rootBranch.cells.push(...this.toCells(rootPoints, rootBranch));

    branches.push(rootBranch);

    while (branches.length > 0) {
      const branch = branches.shift()!;

      const countCellsToDisplay = this.numberConfigFor(
        this.configuration.displayCells,
        branch
      );
      const cellsToDisplay = branch.cells.splice(0, countCellsToDisplay);

      if (cellsToDisplay.length > 0) {
        this.list.push(cellsToDisplay);
      }

      if (branch.cells.length > 0) {
        branches.unshift(branch);
        continue;
      }

      const newLayer = branch.layer + 1;
      if (newLayer >= this.configuration.maxLayer) continue;

      const numberBranches = this.numberConfigFor(
        this.configuration.generateBranches.number,
        branch
      );

      const angleGen = angleGenerator(
        this.numberConfigFor(this.configuration.generateBranches.angle, branch),
        numberBranches
      );

      for (let i = 0; i < numberBranches; i++) {
        const newLength = this.numberConfigFor(
          this.configuration.generateBranches.length,
          branch
        );
        const newAngle = branch.angle + degToRad(angleGen.next().value!);
        const newEnd = endPoint(
          branch.end,
          {
            length: newLength,
            angle: newAngle,
          },
          this.bounds
        );

        const points = this.branchCells(branch.end, newEnd);

        const newBranch: BranchParams = {
          start: branch.end,
          end: newEnd,
          width: 1,
          length: newLength,
          layer: newLayer,
          angle: newAngle,
          cells: [],
        };

        newBranch.cells.push(...this.toCells(points, newBranch));

        newBranch.cells.push(...this.leavesAround(newBranch));
        branches.push(newBranch);
      }
    }
  }

  private toCells(points: Point[], newBranch: BranchParams) {
    return points.map((point) => ({
      ...point,
      char: this.stringConfigFor(
        this.configuration.generateBranches.branchChar,
        newBranch
      ),
    }));
  }

  private branchCells(start: Point, end: Point): Point[] {
    const points: Point[] = line(start, end);

    // points are not necessarily ordered from start to end
    if (points[0].x !== start.x && points[0].y !== start.y) {
      points.reverse();
    }

    return points;
  }

  private leavesAround(branch: BranchParams): Cell[] {
    const validLeavesPositions = validLeavesPositionsAround(branch.cells, 2);
    const leavesToGenerate = this.numberConfigFor(
      this.configuration.generateBranches.leaves,
      branch
    );
    const numLeaves = Math.min(leavesToGenerate, validLeavesPositions.length);
    const leaves = [];
    for (let i = 0; i < numLeaves; i++) {
      const leafIndex = randInt(0, validLeavesPositions.length - 1);
      const [leaf] = validLeavesPositions.splice(leafIndex, 1);
      leaves.push({
        ...leaf,
        char: this.stringConfigFor(
          this.configuration.generateBranches.leafChar,
          branch
        ),
      });
    }
    return leaves;
  }

  private numberConfigFor(
    configuration: NumberConfig,
    branch: BranchParams
  ): number {
    return typeof configuration === "function"
      ? configuration(branch)
      : typeof configuration === "number"
      ? configuration
      : randInt(configuration[0], configuration[1]);
  }

  private stringConfigFor(
    configuration: StringConfig,
    branch: BranchParams
  ): string {
    return typeof configuration === "function"
      ? configuration(branch)
      : typeof configuration === "number"
      ? configuration
      : configuration[randInt(0, configuration.length - 1)];
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
