const blank = " ";
export function drawGridCorners() {
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

  const displayTree = (y: number) => {
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
}
