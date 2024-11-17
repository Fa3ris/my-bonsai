const leaf = "♡";
const blank = " ";
const branch = "|";
const leftBranch = "/";
const rightBranch = "\\";

/**
 *
 * @param {number} width
 * @param {number} height
 * @returns {string[] }
 */
function generateTree(width, height) {
  const xInMiddle = Math.round(Math.random() * (width / 2) + width / 4);
  const seedX = Math.min(xInMiddle, width - 1);

  const yInlowerHalf = Math.round(Math.random() * (height / 2));
  const seedY = yInlowerHalf; // Math.min(yInlowerHalf, height - 1);

  const lines = Array(width * height).fill(blank);

  lines[seedY * width + seedX] = branch;

  for (let y = seedY; y < height - 1; y++) {
    for (let x = 0; x < width; x++) {
      const curr = lines[y * width + x];
      if (curr === blank || curr === leaf) continue;

      const left = Math.max(0, x - 1);
      const center = x;
      const right = Math.min(width - 1, x + 1);
      const lowerChanceIfNearRoot = Math.abs((seedY - y) / seedY);
      const nextRow = (y + 1) * width;
      if (Math.random() < 0.5)
        lines[nextRow + left] =
          Math.random() < lowerChanceIfNearRoot ? leaf : leftBranch;
      if (Math.random() < 0.5)
        lines[nextRow + center] =
          Math.random() < lowerChanceIfNearRoot ? leaf : branch;
      if (Math.random() < 0.5)
        lines[nextRow + right] =
          Math.random() < lowerChanceIfNearRoot ? leaf : rightBranch;
    }
  }

  return { lines, seedY };
}

(function () {
  const el = document.createElement("textarea");
  const width = 80;
  const height = 20;
  el.cols = width;
  el.rows = height;
  document.body.append(el);

  const { lines: tree, seedY } = generateTree(width, height);

  const displayTree = (y) => {
    if (y >= height) {
      return;
    }

    setTimeout(() => {
      el.value = buffer(y, height, width, tree);
      displayTree(y + 1);
    }, 100);
  };

  el.value = buffer(seedY, height, width, tree);

  displayTree(seedY + 1);
})();

function buffer(y, height, width, tree) {
  const blanks = Array(height - y)
    .fill(Array(width).fill(blank).join(""))
    .join("\n");

  const rendered = [...Array(y)]
    .map((_, row) => {
      return tree
        .slice(row * width, (row + 1) * width)
        .reverse()
        .join("");
    })
    .reverse()
    .join("\n");
  return blanks + "\n" + rendered;
}

