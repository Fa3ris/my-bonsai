import { cyrb128, sfc32 } from "../random";

const leaf = "♡";
const blank = " ";
const branch = "|";
const leftBranch = "/";
const rightBranch = "\\";
const lateral = "~";


function trapezoidPoints(
  baseW: number,
  topW: number,
  height: number,
  baseTopOffset: number
) {
  const points: [number, number][] = [];
  for (let yLeaf = 0, offset = 0; yLeaf <= height; yLeaf++, offset++) {
    const t = yLeaf / height; // interpolation
    const widthAtY = Math.round(t * topW + (1 - t) * baseW);

    const offsetAtY = baseTopOffset ? Math.round(baseTopOffset * t) : offset;
    for (let xLeaf = 0; xLeaf < widthAtY; xLeaf++) {
      points.push([offsetAtY + xLeaf, yLeaf]);
    }
  }
  return points;
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {string} pattern
 * @returns array of cases
 */
function casesForPattern(x: number, y: number, pattern: string) {
  const cases = [];
  const tab = pattern.split("");
  const middle = Math.floor(tab.length / 2);
  let stdIdx = 0;
  const lower = x - middle;
  const upper = x + (tab.length % 2 == 0 ? middle - 1 : middle);
  for (let i = lower; i <= upper; i++, stdIdx++) {
    cases.push({ x: i, y, char: pattern[stdIdx] });
  }
  return cases;
}

const BranchType = {
  trunk: 0,
  branch: 1,
  branchLeft: 2,
  branchRight: 3,
  leafPack: 4,
} as const;

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

export class TrunkTree {
  private list: (
    | { x: number; y: number; char: string }
    | { x: number; y: number; char: string }[]
  )[];
  private grid: string[];
  constructor(private width: number, private height: number) {
    this.width = width;
    this.height = height;
    this.list = [];
    this.grid = Array(width * height).fill(blank);
  }

  grow(grid: any) {
    grid.set || grid.setMulti;
    return true ? [this, class NewBranch {}] : undefined;
  }

  growAll() {
    const getIndex = (x: number, y: number) =>
      (this.height - 1 - y) * this.width + x;

    const setCase = (x: number, y: number, char: string) => {
      this.list.push({ x, y, char });
      this.grid[getIndex(x, y)] = char;
    };

    /**
     *
     * @param {{x: number, y: number, char: string}[]} cases
     */
    const setMultiCases = (cases: { x: number; y: number; char: string }[]) => {
      this.list.push(cases);
      for (const v of cases) {
        this.grid[getIndex(v.x, v.y)] = v.char;
      }
    };

    const seedX = Math.round(this.width / 2);
    const seedY = 1;

    const predefined = [
      {
        dx: -1,
        overridePattern: "/~~~~\\",
      },
      { dx: -1, overridePattern: "\\|||\\" },
      { dx: -1, overridePattern: "\\|||\\" },
      { dx: 0, shoot: BranchType.branchLeft, overridePattern: "/||\\" },
      { dx: 0, shoot: BranchType.branchRight, overridePattern: "/||\\" },
      { dx: 1, overridePattern: "/|/", overrideOffsetX: 0 },
      { dx: 1, overridePattern: "/|/", overrideOffsetX: 0 },
      {
        dx: 1,
        overridePattern: "//",
        overrideOffsetX: 1,
      },
      {
        dx: 1,
        shoot: BranchType.branchRight,
        overridePattern: "//",
        overrideOffsetX: 0,
      },
      {
        dx: 0,
        overridePattern: "\\\\",
        shoot: BranchType.leafPack,
        overrideOffsetX: -1,
      },
      {
        dx: -2,
        overridePattern: "\\\\",
        shoot: BranchType.leafPack,
        overrideOffsetX: -1,
      },
      {
        dx: 0,
        shoot: BranchType.leafPack,
        overridePattern: "_",
        overrideOffsetX: 0,
      },
      {
        dx: 0,
        overridePattern: "_",
        overrideOffsetX: -1,
        overrideOffsetY: -1,
      },
      {
        dx: 0,
        overridePattern: "_",
        overrideOffsetX: -1,
        overrideOffsetY: -1,
      },
    ];

    const queue = [
      {
        x: seedX,
        y: seedY,
        dx: 0,
        dy: 0,
        type: BranchType.trunk,
        life: predefined.length,
        age: 0,
      },
    ];

    const shoots = [];
    while (queue.length) {
      const { x, y, life, type, age, dx: prevDx, dy: prevDy } = queue.shift()!;

      if (type === BranchType.trunk) {
        const { dx, shoot, overridePattern, overrideOffsetX, overrideOffsetY } =
          predefined.shift()!;

        let dy = 1;
        let pattern: string = "";
        let offsetX = 0;
        let offsetY = 0;
        const prevDxN = Number(prevDx);
        if (dy === 0) {
          pattern = age < 2 ? "/~~" : "/~";
          if (prevDxN > 0) {
            offsetX = +1;
          } else if (prevDxN < 0) {
            offsetX = -1;
          }
        } else if (dx < 0) {
          pattern = age <= 2 ? "\\|||\\" : age <= 5 ? "\\||\\" : "\\|\\";
          if (prevDxN > 0) {
            offsetX = -1;
          }
        } else if (dx == 0) {
          pattern = "/|\\";
          if (prevDxN < 0) {
            offsetX = 1;
          } else if (prevDxN > 0) {
            offsetX = -2;
          }
        } else if (dx > 0) {
          pattern = "|/";
          if (prevDx === 0) {
            offsetX = 1;
          } else if (prevDxN < 0) {
            offsetX = 1;
          }
        }

        if (overridePattern) {
          pattern = overridePattern;
        }
        if (overrideOffsetX !== undefined) {
          offsetX = overrideOffsetX;
        }

        if (overrideOffsetY !== undefined) {
          offsetY = overrideOffsetY;
        }
        const finalX = x + offsetX;
        const finalY = y + offsetY;
        const casesStr = casesForPattern(finalX, finalY, pattern);

        setMultiCases(casesStr);

        if (shoot) {
          if (shoot === BranchType.branchLeft) {
            shoots.push({
              x: casesStr[0].x,
              y,
              type: shoot,
            });
          } else if (shoot === BranchType.branchRight) {
            shoots.push({
              x: casesStr.at(-1)!.x + 1,
              y,
              type: shoot,
            });
          } else if (shoot === BranchType.leafPack) {
            shoots.push({
              x,
              y,
              type: shoot,
            });
          }
        }

        if (life > 1) {
          queue.push({
            x: finalX + dx,
            y: finalY + dy,
            dx,
            dy,
            life: life - 1,
            type,
            age: age + 1,
          });
        }
      }
    }

    while (shoots.length) {
      const { x, y, type } = shoots.shift()!;
      const shootsQueue = [{ x, y, type, life: 6 }];

      let currX = x;
      let currY = y;
      if (type === BranchType.branchLeft) {
        setMultiCases([{ x: currX, y: currY, char: "_" }]);
        currX--;
        setMultiCases([{ x: currX, y: currY, char: "_" }]);

        currX--;
        setMultiCases([
          { x: currX, y: currY, char: "\\" },
          { x: currX - 1, y: currY + 1, char: leaf },
        ]);

        currX -= 1;
        setMultiCases([
          { x: currX, y: currY, char: "_" },
          { x: currX, y: currY - 1, char: leaf },
        ]);
        currX -= 1;
        setMultiCases([{ x: currX, y: currY, char: "_" }]);
        currX -= 1;
        setMultiCases([{ x: currX, y: currY, char: "_" }]);
        currX -= 1;
        setMultiCases([
          { x: currX, y: currY - 1, char: "/" },
          { x: currX - 1, y: currY - 2, char: leaf },
        ]);
        setMultiCases([{ x: currX, y: currY, char: "_" }]);
        currX -= 1;
        setMultiCases([{ x: currX, y: currY, char: "_" }]);
        currX -= 1;
        setMultiCases([{ x: currX, y: currY, char: "_" }]);

        const baseW = randInt(7, 9);
        const points = trapezoidPoints(baseW, randInt(1, 2), randInt(1, 2), 0);
        for (const p of points) {
          const [px, py] = p;
          setCase(currX - Math.round(baseW / 2) + px, currY - 1 + py, leaf);
        }

        continue;
      }

      while (shootsQueue.length) {
        const { x, y, life, type } = shootsQueue.shift()!;
        if (type === BranchType.branchLeft) {
          setMultiCases(casesForPattern(x, y, "\\="));
          if (life > 1) {
            const dy = randInt(0, 1) < 1 ? 0 : 1;
            shootsQueue.push({ x: x - 1, y: y + dy, life: life - 1, type });
          } else {
            const baseW = randInt(5, 5);
            const points = trapezoidPoints(
              baseW,
              randInt(3, 3),
              randInt(1, 1),
              0
            );
            for (const p of points) {
              const [px, py] = p;
              setCase(x - 1 + px, y + py, leaf);
            }
          }
        } else if (type === BranchType.branchRight) {
          setMultiCases(casesForPattern(x, y, "=/"));
          if (life > 1) {
            shootsQueue.push({ x: x + 1, y, life: life - 1, type });
          } else {
            const baseW = randInt(5, 5);
            const points = trapezoidPoints(
              baseW,
              randInt(3, 3),
              randInt(1, 1),
              0
            );
            for (const p of points) {
              const [px, py] = p;
              setCase(x - Math.round((baseW * 3) / 4) + px, y + py, leaf);
            }
          }
        } else if (type === BranchType.leafPack) {
          const baseW = randInt(7, 9);
          const points = trapezoidPoints(
            baseW,
            randInt(3, 3),
            randInt(1, 2),
            0
          );
          for (const p of points) {
            const [px, py] = p;
            setCase(x - Math.round(baseW / 2) + px, y + py, leaf);
          }
        }
      }
    }
  }

  step(i: number) {
    if (i < 0 || i > this.list.length) return;
    return this.list[i];
  }
}
