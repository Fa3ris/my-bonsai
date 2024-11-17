const leaf = "♡";
const empty = " ";
const branch = "|";
const leftBranch = "\\";
const rightBranch = "/";

function generateTree(width, height) {
  const xInMiddle = Math.round(Math.random() * (width / 2) + width / 4);
  const seedX = Math.min(xInMiddle, width - 1);

  const yInlowerHalf = Math.round(Math.random() * (height / 2) + height / 2);
  const seedY = Math.min(yInlowerHalf, height - 1);

  const lines = Array(width * height).fill(empty);

  lines[seedY * width + seedX] = branch;

  for (let y = seedY; y > 0; y--) {
    for (let x = 0; x < width; x++) {
      const curr = lines[y * width + x];
      if (curr === empty || curr === leaf) continue;

      const left = Math.max(0, x - 1);
      const center = x;
      const right = Math.min(width - 1, x + 1);
      const lowerChanceIfNearRoot = (seedY - y) / seedY;
      if (Math.random() < 0.5)
        lines[(y - 1) * width + left] =
          Math.random() < lowerChanceIfNearRoot ? leaf : leftBranch;
      if (Math.random() < 0.5)
        lines[(y - 1) * width + center] =
          Math.random() < lowerChanceIfNearRoot ? leaf : branch;
      if (Math.random() < 0.5)
        lines[(y - 1) * width + right] =
          Math.random() < lowerChanceIfNearRoot ? leaf : rightBranch;
    }
  }

  return lines;
}

(function () {
  const el = document.createElement("textarea");
  const width = 80;
  const height = 20;
  el.cols = width;
  el.rows = height;
  document.body.append(el);

  const tree = generateTree(width, height);

  for (let y = 0; y < height; y++) {
    el.value += tree.slice(y * width, (y + 1) * width).join("") + "\n";
  }
})();
