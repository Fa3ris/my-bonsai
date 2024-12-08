import { cyrb128, sfc32 } from "../random";

const leaf = "♡";
const blank = " ";
const branch = "|";
const leftBranch = "/";
const rightBranch = "\\";
const lateral = "~";

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

export function drawFirstTree() {
  function generateTree(
    width: number,
    height: number
  ): { lines: string[]; seedY: number } {
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

    const lines = Array(width * height).fill(blank);

    const getIndex = (x: number, y: number) => (height - 1 - y) * width + x;

    const setCase = (x: number, y: number, char: string) => {
      lines[getIndex(x, y)] = char;
    };

    const getCase = (x: number, y: number) => lines[getIndex(x, y)];

    const getChar = (dx: number, dy: number) => charCode[dx + dy * yCodeOffset];

    const seedX = Math.round(width / 2);
    const seedY = 1;
    const queue = [{ x: seedX, y: seedY, life: 40 }];
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
        newX <= 0 || newX >= width - 1 || newY <= 0 || newY >= height - 1;
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

    return { lines, seedY };
  }

  function buffer(y: number, height: number, width: number, tree: string[]) {
    const blanks = Array(height - y)
      .fill(Array(width).fill("*").join(""))
      .join("\n");

    const rendered = [...Array(y)]
      .map((_, row) => {
        return tree
          .slice((height - 1 - row) * width, (height - row) * width)
          .join("");
      })
      .reverse()
      .join("\n");

    if (blanks.length) {
      return blanks + "\n" + rendered;
    }
    return rendered;
  }

  const el = document.createElement("textarea");
  const width = 80;
  const height = 40;
  el.cols = width;
  el.rows = height;
  document.body.append(el);

  const { lines: tree } = generateTree(width, height);

  const displayTree = (y: number) => {
    if (y > height) {
      return;
    }

    setTimeout(() => {
      el.value = buffer(y, height, width, tree);
      displayTree(y + 1);
    }, 100);
  };

  el.value = buffer(0, height, width, tree);

  displayTree(1);
}
