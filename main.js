const leaf = "♡";
const blank = " ";
const branch = "|";
const leftBranch = "/";
const rightBranch = "\\";
const lateral = "~";


// hash function to generate the seed
// https://stackoverflow.com/a/47593316
function cyrb128(str) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  (h1 ^= h2 ^ h3 ^ h4), (h2 ^= h1), (h3 ^= h1), (h4 ^= h1);
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

// create random generator function, the seed is split in 4 numbers
function sfc32(a, b, c, d) {
  return function () {
    a |= 0;
    b |= 0;
    c |= 0;
    d |= 0;
    let t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

const seed = cyrb128(String(new Date().getTime()));
const getRand = sfc32(seed[0], seed[1], seed[2], seed[3]);

/**
 *
 * @param {*} min inclusive
 * @param {*} max inclusive
 * @returns
 */
function randInt(min, max) {
  const minCeiled = Math.ceil(Math.min(min, max));
  const maxFloored = Math.floor(Math.max(min, max));
  return minCeiled + Math.floor(getRand() * (maxFloored - minCeiled + 1));
}

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
  const queue = [{ x: seedX, y: seedY, life: 40 }];
  const maxBranches = 1024;
  let branches = 0;
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
    const newY = y + dy;

    const oob =
      newX <= 0 || newX >= width - 1 || newY <= 0 || newY >= height - 1;
    if (oob) {
      setCase(x, y, leaf);
      continue;
    }

    const ch = life === 1 ? leaf : getChar(dx, dy);
    setCase(x, y, ch);

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
  const height = 40;
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