import { cyrb128, sfc32 } from "../random";

const leaf = "♡";
const blank = " ";
const branch = "|";
const leftBranch = "/";
const rightBranch = "\\";
const lateral = "~";

const yCodeOffset = 10;
// dx + 10 * dy
const charCode = {
  [-2 + -1 * yCodeOffset]: leftBranch, // -11
  [-2 + 0 * yCodeOffset]: lateral, // -1
  [-2 + 1 * yCodeOffset]: rightBranch, // 9

  [-1 + -1 * yCodeOffset]: leftBranch, // -11
  [-1 + 0 * yCodeOffset]: lateral, // -1
  [-1 + 1 * yCodeOffset]: rightBranch, // 9

  [0 + -1 * yCodeOffset]: branch, // -10
  [0 + 0 * yCodeOffset]: lateral, // 0
  [0 + 1 * yCodeOffset]: branch, // 10

  [1 + -1 * yCodeOffset]: rightBranch, // -9
  [1 + 0 * yCodeOffset]: lateral, // 1
  [1 + 1 * yCodeOffset]: leftBranch, // 11

  [2 + -1 * yCodeOffset]: leftBranch, // -11
  [2 + 0 * yCodeOffset]: lateral, // -1
  [2 + 1 * yCodeOffset]: rightBranch, // 9
};
const xDirs = [-2, -1, 0, 1, 2];
const yDirs = [0, 1];

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

export class RandTree {
  private list: any[];
  private grid: string[];
  constructor(private width: number, private height: number) {
    this.width = width;
    this.height = height;
    this.list = [];
    this.grid = Array(width * height).fill(blank);
  }
  growAll() {
    const getIndex = (x: number, y: number) =>
      (this.height - 1 - y) * this.width + x;

    const setCase = (x: number, y: number, char: string) => {
      this.list.push({ x, y, c: char });
      this.grid[getIndex(x, y)] = char;
    };

    const getCase = (x: number, y: number) => this.grid[getIndex(x, y)];

    const getChar = (dx: number, dy: number) => charCode[dx + dy * yCodeOffset];

    const seedX = Math.round(this.width / 2);
    const seedY = 1;
    const queue = [{ x: seedX, y: seedY, life: this.height + 5 }];
    const maxBranches = 1024;
    let branches = 0;
    while (queue.length) {
      const { x, y, life } = queue.shift()!;

      if (life < 1) {
        throw new Error();
      }

      let dx;
      let dy;

      let attempts = 5;
      while (attempts) {
        attempts--;
        const tempDx = xDirs[randInt(0, xDirs.length)];
        const tempDY = yDirs[randInt(0, yDirs.length)];

        if (tempDx === 0 && tempDY === 0) {
          continue;
        }

        const tempNx = x + tempDx;
        const tempNY = y + tempDY;

        if (getCase(tempNx, tempNY) === blank) {
          dx = tempDx;
          dy = tempDY;
          break;
        }
      }

      if (dx === undefined) {
        console.log("cannot find direction, DIE");
        continue;
      }

      const newX = x + dx;
      const newY = y + dy!;

      const oob =
        newX <= 0 ||
        newX >= this.width - 1 ||
        newY <= 0 ||
        newY >= this.height - 1;
      if (oob) {
        setCase(x, y, leaf);
        continue;
      }

      if (getCase(x, y) === blank) {
        const ch = life === 1 ? leaf : getChar(dx, dy!);
        setCase(x, y, ch);
      }

      if (life > 1) {
        const newLife = life - 1;
        queue.push({ x: newX, y: newY, life: newLife });

        if (
          branches < maxBranches &&
          (life % 13 == 0 || randInt(0, 40) < 10 || life < 5)
        ) {
          branches++;
          queue.push({ x: x, y: y, life: newLife });
        }
      }
    }
  }

  /**
   *
   * @param {number} i
   * @returns
   */
  step(i: number) {
    if (i < 0 || i > this.list.length) return;
    return this.list[i];
  }
}
