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

class RandTree {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.list = [];
    this.grid = Array(width * height).fill(blank);
  }
  growAll() {
    const getIndex = (x, y) => (this.height - 1 - y) * this.width + x;

    const setCase = (x, y, char) => {
      this.list.push({ x, y, c: char });
      this.grid[getIndex(x, y)] = char;
    };

    const getCase = (x, y) => this.grid[getIndex(x, y)];

    const getChar = (dx, dy) => charCode[dx + dy * yCodeOffset];

    const seedX = Math.round(this.width / 2);
    const seedY = 1;
    const queue = [{ x: seedX, y: seedY, life: this.height + 5 }];
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
        newX <= 0 ||
        newX >= this.width - 1 ||
        newY <= 0 ||
        newY >= this.height - 1;
      if (oob) {
        setCase(x, y, leaf);
        continue;
      }

      if (getCase(x, y) === blank) {
        const ch = life === 1 ? leaf : getChar(dx, dy);
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
  step(i) {
    if (i < 0 || i > this.list.length) return;
    return this.list[i];
  }
}


const BranchType = {
  trunk: 0,
  branch: 1,
  branchLeft: 2,
  branchRight: 3,
  leafPack: 4,
};

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {string} pattern
 * @returns array of cases
 */
function casesForPattern(x, y, pattern) {
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

class TrunkTree {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.list = [];
    this.grid = Array(width * height).fill(blank);
  }

  grow(grid) {
    grid.set || grid.setMulti;
    return true ? [this, class NewBranch {}] : undefined;
  }

  growAll() {
    const getIndex = (x, y) => (this.height - 1 - y) * this.width + x;

    const setCase = (x, y, char) => {
      this.list.push({ x, y, char });
      this.grid[getIndex(x, y)] = char;
    };

    /**
     *
     * @param {{x: number, y: number, char: string}[]} cases
     */
    const setMultiCases = (cases) => {
      this.list.push(cases);
      for (const v of cases) {
        this.grid[getIndex(v.x, v.y)] = v.char;
      }
    };

    const getCase = (x, y) => this.grid[getIndex(x, y)];

    const getChar = (dx, dy) => charCode[dx + dy * yCodeOffset];

    const seedX = Math.round(this.width / 2);
    const seedY = 1;

    const predefined = [
      {
        dx: -1,
        overridePattern: "/~~~\\",
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
      { dx: 0, overridePattern: "||", overrideOffsetX: -1 },
      { dx: 0, overridePattern: "||", shoot: BranchType.leafPack },
      { dx: 0, overridePattern: "|", shoot: BranchType.leafPack },
      { dx: 0, shoot: BranchType.leafPack, overridePattern: "|" },
    ];

    const queue = [
      {
        x: seedX,
        y: seedY,
        type: BranchType.trunk,
        life: predefined.length,
        age: 0,
      },
    ];

    const shoots = [];
    while (queue.length) {
      const { x, y, life, type, age, dx: prevDx, dy: prevDy } = queue.shift();

      if (type === BranchType.trunk) {
        const { dx, shoot, overridePattern, overrideOffsetX } =
          predefined.shift();

        const dy = 1;
        let pattern;
        let offsetX = 0;
        let offsetY = 0;
        if (dy === 0) {
          pattern = age < 2 ? "/~~" : "/~";
          if (prevDx > 0) {
            offsetX = +1;
          } else if (prevDx < 0) {
            offsetX = -1;
          }
        } else if (dx < 0) {
          pattern = age <= 2 ? "\\|||\\" : age <= 5 ? "\\||\\" : "\\|\\";
          if (prevDx > 0) {
            offsetX = -1;
          }
        } else if (dx == 0) {
          pattern = "/|\\";
          if (prevDx < 0) {
            offsetX = 1;
          } else if (prevDx > 0) {
            offsetX = -2;
          }
        } else if (dx > 0) {
          pattern = "|/";
          if (prevDx === 0) {
            offsetX = 1;
          } else if (prevDx < 0) {
            offsetX = 1;
          }
        }

        if (overridePattern) {
          pattern = overridePattern;
        }
        if (overrideOffsetX !== undefined) {
          offsetX = overrideOffsetX;
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
              x: casesStr.at(-1).x + 1,
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
      const { x, y, type } = shoots.shift();
      const shootsQueue = [{ x, y, type, life: 9 }];

      while (shootsQueue.length) {
        const { x, y, life, type } = shootsQueue.shift();
        if (type === BranchType.branchLeft) {
          setMultiCases(casesForPattern(x, y, "\\_"));
          if (life > 1) {
            shootsQueue.push({ x: x - 1, y, life: life - 1, type });
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
          setMultiCases(casesForPattern(x, y, "_/"));
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
            randInt(3, 6),
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

  /**
   *
   * @param {number} i
   * @returns
   */
  step(i) {
    if (i < 0 || i > this.list.length) return;
    return this.list[i];
  }
}

function trapezoidPoints(baseW, topW, height, baseTopOffset) {
  const points = [];
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

    if (getCase(x, y) === blank) {
      const ch = life === 1 ? leaf : getChar(dx, dy);
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
if (document.body.querySelector("#DEBUG")) {
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
}
(function () {
  const el = document.createElement("textarea");
  const width = 80;
  const height = 20;
  el.cols = width;
  el.rows = height;
  document.body.append(el);

  const tree = new RandTree(width, height);
  tree.growAll();
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
    }, nextTime || randInt(10, 15));
  };

  el.value = grid.toString();

  displayTree(1);
})();

(function () {
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

  let intervalId;
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
})();

(function () {
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

  const tree = new TrunkTree(width, height);
  tree.growAll();
  const grid = new Grid(width, height);

  let step = 0;

  let intervalId;
  const refreshInterval = 50;

  function forward() {
    const toDraw = tree.step(step);
    if (toDraw === undefined) {
      return;
    }

    if (Array.isArray(toDraw)) {
      for (const d of toDraw) {
        const { x, y, char } = d;
        grid.set(x, y, char);
      }
    } else {
      const { x, y, char } = toDraw;
      grid.set(x, y, char);
    }

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

    const toErase = tree.step(step);
    if (toErase === undefined) {
      return;
    }

    if (Array.isArray(toErase)) {
      for (const e of toErase) {
        const { x, y } = e;
        grid.set(x, y, blank);
      }
    } else {
      grid.set(toErase.x, toErase.y, blank);
    }

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