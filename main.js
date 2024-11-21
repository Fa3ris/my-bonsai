const leaf = "♡";
const blank = " ";
const branch = "|";
const leftBranch = "/";
const rightBranch = "\\";
const lateral = "~";

/**
 *
 * @param {*} min inclusive
 * @param {*} max inclusive
 * @returns
 */
function randInt(min, max) {
  const minCeiled = Math.ceil(Math.min(min, max));
  const maxFloored = Math.floor(Math.max(min, max));
  return Math.floor(
    minCeiled + Math.random() * (Math.abs(maxFloored - minCeiled) + 1)
  );
}

const yCodeOffset = 10;
// dx + 10 * dy
const charCode = {
  [-1 + -1 * yCodeOffset]: leftBranch, // -11
  [-1 + 0 * yCodeOffset]: lateral, // -1
  [-1 + 1 * yCodeOffset]: rightBranch, // 9

  [0 + -1 * yCodeOffset]: branch, // -10
  [0 + 0 * yCodeOffset]: lateral, // 0
  [0 + 1 * yCodeOffset]: branch, // 10

  [1 + -1 * yCodeOffset]: rightBranch, // -9
  [1 + 0 * yCodeOffset]: lateral, // 1
  [1 + 1 * yCodeOffset]: leftBranch, // 11
};
const xDirs = [-1, 0, 1];
const yDirs = [0, 1];


class DeterministicTree {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.list = [];
  }

  growAll() {
    console.log("grow");
  }

  /**
   *
   * @param {number} i
   * @returns
   */
  step(i) {
    if (i < 0 || i > this.width - 1 || i > this.height - 1) return;
    return {
      x: i,
      y: i,
      c: leftBranch,
      nextTime: i > 6 ? 50 - 2 * i : undefined,
    };
  }
}
/**
 *
 * @param {number} width
 * @param {number} height
 * @returns {{lines: string[], seedY: number }}
 */
function generateTree(width, height) {
  const lines = Array(width * height).fill(blank);

  const getIndex = (x, y) => (height - 1 - y) * width + x;

  const setCase = (x, y, char) => {
    lines[getIndex(x, y)] = char;
  };

  const getCase = (x, y) => lines[getIndex(x, y)];

  const getChar = (dx, dy) => charCode[dx + dy * yCodeOffset];

  const seedX = Math.round(width / 2);
  const seedY = 1;
  const queue = [{ x: seedX, y: seedY, life: 20 }];

  while (queue.length) {
    const { x, y, life } = queue.shift();

    if (life < 1) {
      throw new Error();
    }

    let dx;
    let dy;

    let attempts = 5;
    while (attempts) {
      attempts--;
      const tempDx = xDirs[randInt(0, xDirs.length - 1)];
      const tempDY = yDirs[randInt(0, yDirs.length - 1)];

      if (tempDx === 0 && tempDY === 0) {
        continue;
      }

      const tempNx = x + tempDx;
      const tempNY = y + tempDY;

      const oob =
        tempNx < 0 || tempNx > width - 1 || tempNY < 0 || tempNY > height - 1;
      if (oob) {
        continue;
      }
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
    const newY = y + dy;

    const ch = life === 1 ? leaf : getChar(dx, dy);
    setCase(x, y, ch);

    if (life > 1) {
      const newLife = life - 1;
      queue.push({ x: newX, y: newY, life: newLife });

      if (life % 13 == 0 || randInt(0, 40) < 10 || life < 5) {
        queue.push({ x: x, y: y, life: newLife });
      }
    }
  }

  return { lines, seedY };
}

if (document.body.querySelector("#DEBUG")) {
  (function () {
    const el = document.createElement("textarea");
    const width = 80;
    const height = 10;
    el.cols = width;
    el.rows = height;
    document.body.append(el);

    const foo = Array(width * height).fill(blank);

    const rY = 0;
    const rX = 0;
    foo[(height - 1 - rY) * width + rX] = "R";
    const cY = 0;
    const cX = width - 1;
    foo[(height - 1 - cY) * width + cX] = "C";

    foo[(height - 1 - (height - 1)) * width + 0] = "A";
    foo[(height - 1 - (height - 1)) * width + width - 1] = "B";

    const displayTree = (y) => {
      if (y > height) {
        return;
      }

      setTimeout(() => {
        el.value = buffer(y, height, width, foo);
        displayTree(y + 1);
      }, 100);
    };

    el.value = buffer(0, height, width, foo);

    displayTree(1);
  })();
}

(function () {
  const el = document.createElement("textarea");
  const width = 80;
  const height = 20;
  el.cols = width;
  el.rows = height;
  document.body.append(el);

  const { lines: tree } = generateTree(width, height);

  const displayTree = (y) => {
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
})();

class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.grid = Array(w * h).fill(blank);
  }
  /**
   *
   * @param {number} x
   * @param {number} y
   * @param {string} c
   */
  set(x, y, c) {
    this.grid[(this.h - 1 - y) * this.w + x] = c;
  }

  toString() {
    const rendered = [...Array(this.h)]
      .map((_, row) => {
        return this.grid
          .slice((this.h - 1 - row) * this.w, (this.h - row) * this.w)
          .join("");
      })
      .reverse()
      .join("\n");
    return rendered;
  }
}

(function () {
  const el = document.createElement("textarea");
  const width = 80;
  const height = 20;
  el.cols = width;
  el.rows = height;
  document.body.append(el);

  const tree = new DeterministicTree(width, height);

  const grid = new Grid(width, height);
  const { x, y, c } = tree.step(0);
  grid.set(x, y, c);

  const displayTree = (step) => {
    const { x, y, c, nextTime } = tree.step(step) || {};
    if (x === undefined) {
      return;
    }
    grid.set(x, y, c);

    setTimeout(() => {
      el.value = grid.toString();
      displayTree(step + 1);
    }, nextTime || randInt(100, 300));
  };

  el.value = grid.toString();

  displayTree(1);
})();

function buffer(y, height, width, tree) {
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