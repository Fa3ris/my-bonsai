type Point = {
  x: number;
  y: number;
};

// THEORY
// http://members.chello.at/%7Eeasyfilter/Bresenham.pdf

type Case = { x: number; y: number; char: string };

type Step = Case | undefined;

export class BezierImplicitEquation {
  constructor() {}
  private list: { x: number; y: number; char: string }[] = [];

  growAll(): void {
    const l1 = [
      ...bezierPoints({ x: 0, y: 0 }, { x: 0, y: 2 }, { x: 4, y: 4 }),
      ...bezierPoints({ x: 15, y: 0 }, { x: 15, y: 2 }, { x: 11, y: 4 }),
      // ...bezierPointsOpti({ x: 0, y: 0 }, { x: 0, y: 2 }, { x: 4, y: 4 }),
      // ...bezierPointsOpti({ x: 15, y: 0 }, { x: 15, y: 2 }, { x: 11, y: 4 }),
      // ...bezierPointsOpti({ x: 17, y: 1 }, { x: 2, y: 0 }, { x: -2, y: 12 }),
      // ...bezierPointsOpti({ x: 0, y: 9 }, { x: 16, y: 11 }, { x: 19, y: 1 }),
      // ...bezierPointsOpti({ x: 0, y: 9 }, { x: 13, y: 10 }, { x: 14, y: 1 }),
    ];
    this.list = [...l1];
  }

  step(i: number): Step {
    if (i < 0 || i > this.list.length) return undefined;
    return this.list[i];
  }
}

function bezierPoints(p0: Point, p1: Point, p2: Point): Case[] {
  const { x: x0, y: y0 } = p0;
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;

  const x0Prime = x0 - x1;
  const y0Prime = y0 - y1;

  const x2Prime = x2 - x1;
  const y2Prime = y2 - y1;

  const sx = Math.sign(x2 - x0);
  const sy = Math.sign(y2 - y0);

  const curvature = x0Prime * y2Prime - x2Prime * y0Prime;

  const bezier = (p: Point) => {
    const { x, y } = p;
    return (
      Math.pow(x * (y0 - 2 * y1 + y2) - y * (x0 - 2 * x1 + x2), 2) +
      2 * curvature * (x * (y0 - y2) - y * (x0 - x2)) +
      Math.pow(curvature, 2)
    );
  };

  const dxPos = (p: Point) => {
    const { x, y } = p;
    const xPrime = x - x1;
    const yPrime = y - y1;
    return (
      (1 + 2 * xPrime) * Math.pow(y0Prime + y2Prime, 2) -
      2 * yPrime * (x0Prime + x2Prime) * (y0Prime + y2Prime) +
      2 * curvature * (y0Prime - y2Prime)
    );
  };

  const dxNeg = (p: Point) => {
    const { x, y } = p;
    const xPrime = x - x1;
    const yPrime = y - y1;
    return (
      (1 - 2 * xPrime) * Math.pow(y0Prime + y2Prime, 2) +
      2 * yPrime * (x0Prime + x2Prime) * (y0Prime + y2Prime) -
      2 * curvature * (y0Prime - y2Prime)
    );
  };

  const dyPos = (p: Point) => {
    const { x, y } = p;
    const xPrime = x - x1;
    const yPrime = y - y1;
    return (
      (1 + 2 * yPrime) * Math.pow(x0Prime + x2Prime, 2) -
      2 * xPrime * (x0Prime + x2Prime) * (y0Prime + y2Prime) -
      2 * curvature * (x0Prime - x2Prime)
    );
  };

  const dyNeg = (p: Point) => {
    const { x, y } = p;
    const xPrime = x - x1;
    const yPrime = y - y1;
    return (
      (1 - 2 * yPrime) * Math.pow(x0Prime + x2Prime, 2) +
      2 * xPrime * (x0Prime + x2Prime) * (y0Prime + y2Prime) +
      2 * curvature * (x0Prime - x2Prime)
    );
  };

  let e_xy = bezier({ x: x0Prime + sx, y: y0Prime + sy });
  let dx = (sx > 0 ? dxPos : dxNeg)({ x: x0, y: y0 + 1 });
  let dy = (sy > 0 ? dyPos : dyNeg)({ x: x0 + 1, y: y0 });

  const dxx = sx * 2 * Math.pow(y0Prime + y2Prime, 2);
  const dyy = sy * 2 * Math.pow(x0Prime + x2Prime, 2);
  const dxy = sx * sy * -2 * (x0Prime + x2Prime) * (y0Prime + y2Prime);

  let x = x0,
    y = y0;

  // console.log("exy", e_xy, "dx", dx, "dy", dy);
  const points: Case[] = [];
  while (true) {
    points.push({ x, y, char: "*" });

    // compute before the adjustments
    const stepInY = 2 * e_xy - dy < 0;
    const stepInX = 2 * e_xy - dx > 0;

    if (stepInX) {
      if (x === x2) break;
      x += sx;
      dx += dxx;
      dy += dxy;
      e_xy += dx;
    }

    if (stepInY) {
      if (y === y2) break;
      y += sy;
      dx += dxy;
      dy += dyy;
      e_xy += dy;
    }
  }
  return points;
}

// the original implementation
// les calculs sont imbitables !!!
function bezierPointsOpti(p0: Point, p1: Point, p2: Point): Case[] {
  const { x: x0, y: y0 } = p0;
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;

  const sx = x0 < x2 ? 1 : -1,
    sy = y0 < y2 ? 1 : -1;

  let x = x0 - 2 * x1 + x2,
    y = y0 - 2 * y1 + y2,
    xy = 2 * x * y * sx * sy;

  const cur = (sx * sy * (x * (y2 - y0) - y * (x2 - x0))) / 2;

  let dx =
    (1 - 2 * Math.abs(x0 - x1)) * y * y +
    Math.abs(y0 - y1) * xy -
    2 * cur * Math.abs(y0 - y2);

  let dy =
    (1 - 2 * Math.abs(y0 - y1)) * x * x +
    Math.abs(x0 - x1) * xy +
    2 * cur * Math.abs(x0 - x2);

  let ex =
    (1 - 2 * Math.abs(x2 - x1)) * y * y +
    Math.abs(y2 - y1) * xy +
    2 * cur * Math.abs(y0 - y2);

  let ey =
    (1 - 2 * Math.abs(y2 - y1)) * x * x +
    Math.abs(x2 - x1) * xy -
    2 * cur * Math.abs(x0 - x2);

  x *= 2 * x;
  y *= 2 * y;

  if (cur < 0) {
    /* negated curvature */
    x = -x;
    dx = -dx;
    ex = -ex;
    xy = -xy;
    y = -y;
    dy = -dy;
    ey = -ey;
  }

  if (dx >= -y || dy <= -x || ex <= -y || ey >= -x) {
    throw new Error("assert failed");
  }

  dx -= xy;
  ex = dx + dy;
  dy -= xy;

  let x0Prime = x0,
    y0Prime = y0;

  // console.log("ex", ex, "dx", dx, "dy", dy);

  const points: Case[] = [];
  for (;;) {
    /* plot curve */
    points.push({ x: x0Prime, y: y0Prime, char: "*" });
    ey = 2 * ex - dy; /* save value for test of y step */
    if (2 * ex >= dx) {
      /* x step */
      if (x0Prime == x2) break;
      x0Prime += sx;
      dy -= xy;
      ex += dx += y;
    }
    if (ey <= 0) {
      /* y step */
      if (y0Prime == y2) break;
      y0Prime += sy;
      dx -= xy;
      ex += dy += x;
    }
  }

  return points;
}
