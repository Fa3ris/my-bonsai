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
    const xOffset = 4;
    const xOffset2 = 6;
    const yOffset = 10;
    const l1 = [
      // from left down to up right
      ...bezierPoints({ x: 0, y: 0 }, { x: 0, y: 2 }, { x: 4, y: 4 }),
      ...bezierPointsOpti(
        { x: 0 + xOffset, y: 0 },
        { x: 0 + xOffset, y: 2 },
        { x: 4 + xOffset, y: 4 }
      ),
      // switch p0 and p2
      // // from up right to left down
      ...bezierPoints(
        { x: 4, y: 4 + yOffset },
        { x: 0, y: 2 + yOffset },
        { x: 0, y: 0 + yOffset }
      ),
      ...bezierPointsOpti(
        { x: 4 + xOffset2, y: 4 + yOffset },
        { x: 0 + xOffset2, y: 2 + yOffset },
        { x: 0 + xOffset2, y: 0 + yOffset }
      ),
      //
      // // from down right to up left
      ...bezierPoints({ x: 15, y: 0 }, { x: 15, y: 2 }, { x: 11, y: 4 }),
      ...bezierPointsOpti(
        { x: 15 + xOffset, y: 0 },
        { x: 15 + xOffset, y: 2 },
        { x: 11 + xOffset, y: 4 }
      ),
      // down left to up right
      ...bezierPoints({ x: 20, y: 0 }, { x: 20, y: 2 }, { x: 20 + 4, y: 5 }),
      ...bezierPointsOpti(
        { x: 20 + xOffset, y: 0 },
        { x: 20 + xOffset, y: 2 },
        { x: 20 + 4 + xOffset, y: 5 }
      ),
      // almost straight lines - should not draw
      ...bezierPoints({ x: 17, y: 1 }, { x: 2, y: 0 }, { x: -2, y: 12 }, true),
      ...bezierPointsOpti({ x: 17, y: 1 }, { x: 2, y: 0 }, { x: -2, y: 12 }),
      ...bezierPoints({ x: 0, y: 9 }, { x: 16, y: 11 }, { x: 19, y: 1 }),
      ...bezierPointsOpti({ x: 0, y: 9 }, { x: 16, y: 11 }, { x: 19, y: 1 }),

      // not working - should not print apparently
      ...bezierPoints({ x: 0, y: 12 }, { x: 13, y: 10 }, { x: 14, y: 1 }, true),
      ...bezierPointsOpti({ x: 0, y: 9 }, { x: 13, y: 10 }, { x: 14, y: 1 }),
    ];
    this.list = [...l1];
  }

  step(i: number): Step {
    if (i < 0 || i > this.list.length) return undefined;
    return this.list[i];
  }
}

function bezierPoints(
  p0: Point,
  p1: Point,
  p2: Point,
  shouldFail = false
): Case[] {
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

  const sCurvature = Math.sign(curvature);

  const bezier = (p: Point) => {
    const { x, y } = p;
    return (
      Math.pow(x * (y0 - 2 * y1 + y2) - y * (x0 - 2 * x1 + x2), 2) +
      2 * curvature * (x * (y0 - y2) - y * (x0 - x2)) +
      Math.pow(curvature, 2)
    );
  };

  const diffFunc = (p1: Point, p2: Point) => {
    return bezier(p1) - bezier(p2);
  };

  let e_xy =
    sx * sy * sCurvature * bezier({ x: x0Prime + sx, y: y0Prime + sy });
  const dx0 =
    sx *
    sy *
    sCurvature *
    diffFunc(
      { x: x0Prime + sx, y: y0Prime + sy },
      { x: x0Prime, y: y0Prime + sy }
    );

  const dx2 =
    sx *
    sy *
    sCurvature *
    diffFunc(
      { x: x2Prime - sx, y: y2Prime - sy },
      { x: x2Prime, y: y2Prime - sy }
    );
  let dx = dx0;

  const dy0 =
    sy *
    sx *
    sCurvature *
    diffFunc(
      { x: x0Prime + sx, y: y0Prime + sy },
      { x: x0Prime + sx, y: y0Prime }
    );
  const dy2 =
    sy *
    sx *
    sCurvature *
    diffFunc(
      { x: x2Prime - sx, y: y2Prime - sy },
      { x: x2Prime - sx, y: y2Prime }
    );
  let dy = dy0;

  const dxx = sx * 2 * Math.pow(y0Prime + y2Prime, 2);
  const dyy = sy * 2 * Math.pow(x0Prime + x2Prime, 2);
  const dxy = -2 * (x0Prime + x2Prime) * (y0Prime + y2Prime);

  console.warn("mine", {
    dx0,
    dxx,
    dy0,
    dyy,
    dx2,
    dy2,
    e_xy,
    dxy,
    sx,
    sy,

    d1: dx0 + dxx,
    d2: dy0 + dyy,
    d3: dx2 + dxx,
    d4: dy2 + dyy,
    curvature,
    sCurvature,
  });

  // NO IDEA WHAT IS THE CONDITION!!!
  const x0Above = dx0 + dyy >= 0; // sCurvature > 0 ? dx0 + dxx >= 0 : dx0 + dxx >= 0;
  const y0Under = dy0 + dxx <= 0;
  const x2Above = dx2 + dyy <= 0;
  const y2Under = dy2 + dxx >= 0;
  console.log({ x0Above, y0Under, x2Above, y2Under });

  if (x0Above || y0Under || x2Above || y2Under) {
    console.error("mine assert failed");
    return [];
  }

  if (shouldFail) {
    console.error("mine should have failed");
  }

  const points: Case[] = [];
  let x = x0,
    y = y0;
  while (true) {
    points.push({ x, y, char: "*" });

    // compute before the adjustments
    const e_x = e_xy - dx;
    const e_y = e_xy - dy;
    const stepInX = e_xy + e_x > 0;
    const stepInY = e_xy + e_y < 0;

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

  console.warn("opti", {
    dx0: dx,
    dxx: y,
    dy0: dy,
    dyy: x,
    dx2: ex,
    dy2: ey,
    d1: dx + y,
    d2: dy + x,
    d3: ex + y,
    d4: ey + x,
    dxy: xy,
    curvature: cur,
    sx,
    sy,
  });

  if (dx >= -y || dy <= -x || ex <= -y || ey >= -x) {
    console.error("opti should fail");
    return [];
  }

  dx -= xy;
  ex = dx + dy;
  dy -= xy;

  console.warn("opti before loop", {
    dx0: dx,
    dxx: y,
    dy0: dy,
    dyy: x,
    dx2: ex,
    dy2: ey,
    d1: dx + y,
    d2: dy + x,
    d3: ex + y,
    d4: ey + x,
    dxy: xy,
    curvature: cur,
    sx,
    sy,
    e_xy: ex,
  });

  let x0Prime = x0,
    y0Prime = y0;

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
