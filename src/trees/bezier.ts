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
    const vertices: [Point, Point, Point][] = [
      [
        { x: 0, y: 0 },
        { x: 4, y: 2 },
        { x: 4, y: 4 },
      ],
      [
        { x: 0, y: 0 },
        { x: 4, y: 2 },
        { x: 11, y: 7 },
      ],
      [
        { x: 0, y: 0 },
        { x: 0, y: 2 },
        { x: 4, y: 4 },
      ],
      [
        { x: 4, y: 4 },
        { x: 0, y: 2 },
        { x: 0, y: 0 },
      ],
      [
        { x: 15, y: 0 },
        { x: 15, y: 2 },
        { x: 11, y: 4 },
      ],
      [
        { x: 20, y: 0 },
        { x: 20, y: 2 },
        { x: 20 + 4, y: 5 },
      ],
      [
        { x: 17, y: 1 },
        { x: 2, y: 0 },
        { x: -2, y: 12 },
      ],
      [
        { x: 0, y: 9 },
        { x: 16, y: 11 },
        { x: 19, y: 1 },
      ],
    ];

    const xOffset = 4;
    const yOffset = 10;
    const optiVertices = vertices.map(([p0, p1, p2]) => {
      return [
        { x: p0.x, y: p0.y + yOffset },
        { x: p1.x, y: p1.y + yOffset },
        { x: p2.x, y: p2.y + yOffset },
      ];
    });

    const fineOptiVertices = vertices.map(([p0, p1, p2]) => {
      return [
        { x: p0.x + 7 * xOffset, y: p0.y },
        { x: p1.x + 7 * xOffset, y: p1.y },
        { x: p2.x + 7 * xOffset, y: p2.y },
      ];
    });
    const fineVertices = vertices.map(([p0, p1, p2]) => {
      return [
        { x: p0.x + 7 * xOffset, y: p0.y + yOffset },
        { x: p1.x + 7 * xOffset, y: p1.y + yOffset },
        { x: p2.x + 7 * xOffset, y: p2.y + yOffset },
      ];
    });
    const xOffset2 = 6;
    const l1 = [
      ...bezierPoints({ x: 0, y: 0 }, { x: 4, y: 2 }, { x: 4, y: 4 }),
      ...bezierPoints({ x: 0, y: 0 }, { x: 4, y: 2 }, { x: 11, y: 7 }),
      ...bezierPointsOpti(
        { x: 0 + 30, y: 0 },
        { x: 4 + 30, y: 2 },
        { x: 11 + 30, y: 7 }
      ),
      ...bezierPointsOpti(
        { x: 0 + 30, y: 0 },
        { x: 4 + 30, y: 2 },
        { x: 4 + 30, y: 4 }
      ),
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
        { x: 4 + xOffset, y: 4 + yOffset },
        { x: 0 + xOffset, y: 2 + yOffset },
        { x: 0 + xOffset, y: 0 + yOffset }
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
      ...bezierPoints({ x: 0, y: 9 }, { x: 16, y: 11 }, { x: 19, y: 1 }, true),
      ...bezierPointsOpti({ x: 0, y: 9 }, { x: 16, y: 11 }, { x: 19, y: 1 }),

      // not working - should not print apparently
      ...bezierPoints({ x: 0, y: 12 }, { x: 13, y: 10 }, { x: 14, y: 1 }, true),
      ...bezierPointsOpti({ x: 0, y: 9 }, { x: 13, y: 10 }, { x: 14, y: 1 }),
    ];

    const l2 = [
      ...vertices.flatMap((v) => bezierPoints(v[0], v[1], v[2])),
      ...optiVertices.flatMap(([p0, p1, p2]) => bezierPointsOpti(p0, p1, p2)),
      ...fineOptiVertices.flatMap((v) => fineQuadBezierOpti(v[0], v[1], v[2])),
      // ...fineVertices.flatMap((v) =>
      //   bezierPointsFineResolution(v[0], v[1], v[2])
      // ),
    ];

    const l3 = [];
    for (const v of fineVertices.flatMap((v) => compare(v[0], v[1], v[2]))) {
      l3.push(v);
    }
    this.list = [...l2, ...l3];
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
  const sc = Math.sign(curvature);

  const bezier = (p: Point) => {
    const { x, y } = p;
    return (
      Math.pow(
        x * (y0Prime + y2Prime) - y * (x0Prime + x2Prime) - curvature,
        2
      ) +
      4 * curvature * (x * y0Prime - y * x0Prime)
    );
  };

  const diffFunc = (p1: Point, p2: Point) => bezier(p1) - bezier(p2);

  const dx0 = diffFunc(
    { x: x0Prime + sx, y: y0Prime + sy },
    { x: x0Prime, y: y0Prime + sy }
  );

  let dx = dx0;

  const dy0 = diffFunc(
    { x: x0Prime + sx, y: y0Prime + sy },
    { x: x0Prime + sx, y: y0Prime }
  );

  let dy = dy0;

  const dxx = 2 * Math.pow(y0Prime + y2Prime, 2);
  const dyy = 2 * Math.pow(x0Prime + x2Prime, 2);
  const dxy = -2 * (x0Prime + x2Prime) * (y0Prime + y2Prime);

  let e_xy = bezier({ x: x0Prime + sx, y: y0Prime + sy });

  const sign = sx * sy > 0 ? sc : -sc; // empirical

  // check if it stays a straight line
  let xTest = x0,
    yTest = y0,
    e_xyTest = e_xy,
    dxTest = dx,
    dyText = dy,
    testLoop = 2; // empirical
  while (testLoop--) {
    const e_x = e_xyTest - dxTest;
    const e_y = e_xyTest - dyText;
    const stepInX = sign * (e_xyTest + e_x) > 0;
    const stepInY = sign * (e_xyTest + e_y) < 0;

    if (stepInX) {
      if (xTest === x2) break;
      xTest += sx;
      dxTest += dxx;
      dyText += dxy;
      e_xyTest += dxTest;
    }

    if (stepInY) {
      if (yTest === y2) break;
      yTest += sy;
      dxTest += dxy;
      dyText += dyy;
      e_xyTest += dyText;
    }
  }

  if (xTest === x0 || yTest === y0) {
    return [];
  }

  const points: Case[] = [];
  let x = x0,
    y = y0;
  while (true) {
    points.push({ x, y, char: "*" });

    const e_x = e_xy - dx;
    const e_y = e_xy - dy;
    const stepInX = sign * (e_xy + e_x) > 0;
    const stepInY = sign * (e_xy + e_y) < 0;

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

  let x = x0 - 2 * x1 + x2, // x0Prime + x2Prime
    y = y0 - 2 * y1 + y2, // y0Prime + y2Prime
    xy = 2 * x * y * sx * sy; // 2(x0Prime + x2Prime)(y0Prime + y2Prime)

  /* 
    ((x0Prime + x2Prime)(y2 - y0) - (y0Prime + y2Prime)(x2 - x0)) / 2
    (x0Prime(y2 - y0) + x2Prime(y2 - y0) - y0P(x2-x0) - y2P(x2-x0)) /2
    (x0P(y2 - y1 + y1 - y0) + x2P(y2 - y1 - y0 + y1) - y0P(x2 - x1 -x0 + x1) - y2P(x2 -x1 -x0 + x1)) /2
    (x0P* y2P - x0P*y0P + x2P*y2P - x2P*y0P - y0P*x2P + y0P*x0P - y2P*x2P + y2P*x0P)/2
    (x0P*y2P- x2p*y0P - y0P * x2P + y2P*x0P) / 2
    x0P*y2P - x2p*y0P
  */
  const cur = (sx * sy * (x * (y2 - y0) - y * (x2 - x0))) / 2;

  let dx = // dx- for x = x0, y = y0
    // e(x0Prime -1, y0Prime) - e(x0Prime, y0Prime)
    (1 - 2 * Math.abs(x0 - x1)) * y * y +
    Math.abs(y0 - y1) * xy -
    2 * cur * Math.abs(y0 - y2);

  let dy = // dy- for x=x0, y=y0
    (1 - 2 * Math.abs(y0 - y1)) * x * x +
    Math.abs(x0 - x1) * xy +
    2 * cur * Math.abs(x0 - x2);

  let ex = // dx- for x = x2, y=y2
    (1 - 2 * Math.abs(x2 - x1)) * y * y +
    Math.abs(y2 - y1) * xy +
    2 * cur * Math.abs(y0 - y2);

  let ey = // dy- for x = x2, y=y2
    (1 - 2 * Math.abs(y2 - y1)) * x * x +
    Math.abs(x2 - x1) * xy -
    2 * cur * Math.abs(x0 - x2);

  x *= 2 * x; // x = 2 * (x0Prime + x2Prime)^2 = dyy
  y *= 2 * y; // y = 2 * (y0P + y2P) ^2 = dxx

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
    d1b: dx >= -y,
    d2b: dy <= -x,
    exb: ex < -y,
    eyb: ey >= -x,
    dxy: xy,
    curvature: cur,
    sx,
    sy,
  });

  // dx-(p=PO) + dxx >=0
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

const compare = (p0: Point, p1: Point, p2: Point) => {
  const mine = {};
  const theirs: Record<string, any> = {};

  const points = bezierPointsFineResolution(p0, p1, p2);
  fineQuadBezierOpti(p0, p1, p2);
  type Diff<T extends any = any> = { key: string; mine: T; theirs: T };

  const diffs: Diff[] = [];
  for (const [key, value] of Object.entries(mine)) {
    if (value !== theirs[key]) {
      diffs.push({ key, mine: value, theirs: theirs[key] });
    }
  }

  if (diffs.length) {
    console.warn("diffs", diffs);
    throw new Error("diffs");
  }

  return points;

  function bezierPointsFineResolution(p0: Point, p1: Point, p2: Point): Case[] {
    const { x: x0, y: y0 } = p0;
    const { x: x1, y: y1 } = p1;
    const { x: x2, y: y2 } = p2;

    const sx = x0 < x2 ? 1 : -1,
      sy = y0 < y2 ? 1 : -1;

    const x0Prime = x0 - x1;
    const x2Prime = x2 - x1;

    const y0Prime = y0 - y1;
    const y2Prime = y2 - y1;

    const resolutionFactorX = x0Prime + x2Prime;
    const resolutionFactorY = y0Prime + y2Prime;

    const dyy = 2 * resolutionFactorX * resolutionFactorX;
    const dxx = 2 * resolutionFactorY * resolutionFactorY;

    console.warn("mine fy", resolutionFactorY);
    console.warn("mine fx", resolutionFactorX);
    console.warn("mine dyy", dyy);
    const dxy = 2 * resolutionFactorX * resolutionFactorY;
    const signedDxy = sx * sy * dxy;

    const curvature = x0Prime * y2Prime - x2Prime * y0Prime;

    const signedCurvature = sx * sy * curvature;
    console.warn("mine curvature", signedCurvature);

    const computeDeviations = (
      point: Point,
      sign: 1 | -1
    ): { dx: number; dy: number } => {
      const { x, y } = point;
      const dx =
        -Math.abs(x - x1) * dxx +
        Math.abs(y - y1) * signedDxy -
        sign * 2 * signedCurvature * Math.abs(y0 - y2);

      const dy =
        -Math.abs(y - y1) * dyy +
        Math.abs(x - x1) * signedDxy +
        sign * 2 * signedCurvature * Math.abs(x0 - x2);

      return { dx, dy };
    };

    const { dx: dx0, dy: dy0 } = computeDeviations(p0, 1);
    const { dx: dx2, dy: dy2 } = computeDeviations(p2, -1);

    const signOfGradientIsConstant =
      x0Prime * x2Prime <= 0 && y0Prime * y2Prime <= 0;

    if (!signOfGradientIsConstant) {
      return [];
    }

    if (signedCurvature === 0) {
      return [];
    }

    let resolutionFactor: number = 1;
    if (dx0 === 0 || dy0 === 0 || dx2 === 0 || dy2 === 0) {
      console.log("mine divide by zero", dxy, signedCurvature);
      resolutionFactor = 1 + Math.abs(dxy / (2 * signedCurvature)) / 2;
    } else {
      resolutionFactor = Math.max(
        (2 * dxx) / dx0,
        (2 * dyy) / dy0,
        (2 * dxx) / dx2,
        (2 * dyy) / dy2,
        resolutionFactor
      );
    }

    const { dxxIter, dyyIter, dxyIter } =
      signedCurvature < 0
        ? {
            dxxIter: -dxx,
            dyyIter: -dyy,
            dxyIter: -dxy,
          }
        : {
            dxxIter: dxx,
            dyyIter: dyy,
            dxyIter: dxy,
          };

    let dxIter = dx0,
      dyIter = dy0;
    if (signedCurvature < 0) {
      console.warn("switch signs mine", signedCurvature);
      dxIter = -dxIter;
      dyIter = -dyIter;
    }
    Object.assign(mine, {
      dxBefore: dxIter,
      dyBefore: dyIter,
    });

    dxIter = resolutionFactor * dxIter + dxxIter / 2 - dxyIter;
    dyIter = resolutionFactor * dyIter + dyyIter / 2 - dxyIter;

    let error = dxIter + dyIter + dxyIter;

    let resolutionX = resolutionFactor;
    let resolutionY = resolutionFactor;

    let temp: number;
    let x = x0;
    let y = y0;

    const points: Case[] = [];

    Object.assign(mine, {
      dx: dxIter,
      dy: dyIter,
      dxx: dxxIter,
      dyy: dyyIter,
      dxy: dxyIter,
      curvature: 2 * signedCurvature,
      error,
      resolutionFactor,
      sx,
      sy,
    });
    let iterations = 15;
    while (iterations--) {
      points.push({ x, y, char: "*" });
      if (x === x2 && y === y2) {
        break;
      }

      do {
        temp = 2 * error - dyIter;
        if (2 * error >= dxIter) {
          resolutionX--;
          dyIter -= dxyIter;
          dxIter += dxxIter;

          error += dxIter;
        }

        if (temp <= 0) {
          resolutionY--;
          dxIter -= dxyIter;
          dyIter += dyyIter;
          error += dyIter;
        }
      } while (resolutionX > 0 && resolutionY > 0);

      if (2 * resolutionX <= resolutionFactor) {
        x += sx;
        resolutionX += resolutionFactor;
      }
      if (2 * resolutionY <= resolutionFactor) {
        y += sy;
        resolutionY += resolutionFactor;
      }
    }

    return points;
  }
  function fineQuadBezierOpti(p0: Point, p1: Point, p2: Point): Case[] {
    let { x: x0, y: y0 } = p0;
    const { x: x1, y: y1 } = p1;
    const { x: x2, y: y2 } = p2;

    let sx = x0 < x2 ? 1 : -1,
      sy = y0 < y2 ? 1 : -1; /* step direction */
    let f = 1,
      fx = x0 - 2 * x1 + x2,
      fy = y0 - 2 * y1 + y2;
    console.warn("theirs fy", fy);
    console.warn("theirs fx", fx);
    let x = 2 * fx * fx,
      y = 2 * fy * fy,
      xy = 2 * fx * fy * sx * sy;
    let cur = sx * sy * (fx * (y2 - y0) - fy * (x2 - x0)); /* curvature */

    console.warn("theirs dyy", x);
    console.warn("their curvature", cur);
    /* compute error increments of P0 */
    let dx =
      Math.abs(y0 - y1) * xy - Math.abs(x0 - x1) * y - cur * Math.abs(y0 - y2);
    let dy =
      Math.abs(x0 - x1) * xy - Math.abs(y0 - y1) * x + cur * Math.abs(x0 - x2);
    /* compute error increments of P2 */
    let ex =
      Math.abs(y2 - y1) * xy - Math.abs(x2 - x1) * y + cur * Math.abs(y0 - y2);
    let ey =
      Math.abs(x2 - x1) * xy - Math.abs(y2 - y1) * x - cur * Math.abs(x0 - x2);

    /* sign of gradient must not change */
    const signOfGradientIsConstant =
      (x0 - x1) * (x2 - x1) <= 0 && (y0 - y1) * (y2 - y1) <= 0;
    if (!signOfGradientIsConstant) {
      return [];
      // console.assert((x0 - x1) * (x2 - x1) <= 0 && (y0 - y1) * (y2 - y1) <= 0);
    }
    if (cur == 0) {
      return [];
    } // plotLine(x0,y0, x2,y2); return; } /* straight line */
    /* compute required minimum resolution factor */
    if (dx == 0 || dy == 0 || ex == 0 || ey == 0) {
      console.log("theirs divide by zero", xy, cur);
      f = Math.abs(xy / cur) / 2 + 1; /* division by zero: use curvature */
    } else {
      fx = (2 * y) / dx;
      if (fx > f) f = fx; /* increase resolution */
      fx = (2 * x) / dy;
      if (fx > f) f = fx;
      fx = (2 * y) / ex;
      if (fx > f) f = fx;
      fx = (2 * x) / ey;
      if (fx > f) f = fx;
    } /* negated curvature? */
    const points: Case[] = [];
    if (cur < 0) {
      x = -x;
      y = -y;
      dx = -dx;
      dy = -dy;
      xy = -xy;
    }
    Object.assign(theirs, {
      dxBefore: dx,
      dyBefore: dy,
    });
    dx = f * dx + y / 2 - xy;
    dy = f * dy + x / 2 - xy;
    ex = dx + dy + xy; /* error 1.step */
    Object.assign(theirs, {
      dx,
      dy,
      dxx: y,
      dyy: x,
      dxy: xy,
      curvature: cur,
      error: ex,
      resolutionFactor: f,
      sx,
      sy,
    });
    for (fx = fy = f; ; ) {
      /* plot curve */
      points.push({ x: x0, y: y0, char: "*" });
      //  setPixel(x0,y0);
      if (x0 == x2 && y0 == y2) break;
      do {
        /* move f sub-pixel */
        ey = 2 * ex - dy; /* save value for test of y step */
        if (2 * ex >= dx) {
          fx--;
          dy -= xy;
          ex += dx += y;
        } /* x step */
        if (ey <= 0) {
          fy--;
          dx -= xy;
          ex += dy += x;
        } /* y step */
      } while (fx > 0 && fy > 0); /* pixel complete? */
      if (2 * fx <= f) {
        x0 += sx;
        fx += f;
      } /* sufficient sub-steps.. */
      if (2 * fy <= f) {
        y0 += sy;
        fy += f;
      } /* .. for a pixel? */
    }
    return points;
  }
};

// shitty implementation
function bezierPointsFineResolution(p0: Point, p1: Point, p2: Point): Case[] {
  const { x: x0, y: y0 } = p0;
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;

  const sx = x0 < x2 ? 1 : -1,
    sy = y0 < y2 ? 1 : -1;

  const x0Prime = x0 - x1;
  const x2Prime = x2 - x1;

  const y0Prime = y0 - y1;
  const y2Prime = y2 - y1;

  const resolutionFactorX = x0Prime + x2Prime;
  const resolutionFactorY = y0Prime + y2Prime;

  const dyy = 2 * resolutionFactorX * resolutionFactorX;
  const dxx = 2 * resolutionFactorY * resolutionFactorY;

  const dxy = 2 * resolutionFactorX * resolutionFactorY;
  const signedDxy = sx * sy * dxy;

  const curvature = x0Prime * y2Prime - x2Prime * y0Prime;

  const signedCurvature = sx * sy * curvature;

  const computeDeviations = (
    point: Point,
    sign: 1 | -1
  ): { dx: number; dy: number } => {
    const { x, y } = point;
    const dx =
      -Math.abs(x - x1) * dxx +
      Math.abs(y - y1) * signedDxy -
      sign * signedCurvature * Math.abs(y0 - y2);

    const dy =
      -Math.abs(y - y1) * dyy +
      Math.abs(x - x1) * signedDxy +
      sign * signedCurvature * Math.abs(y0 - y2);

    return { dx, dy };
  };

  const { dx: dx0, dy: dy0 } = computeDeviations(p0, 1);
  const { dx: dx2, dy: dy2 } = computeDeviations(p2, -1);

  const signOfGradientIsConstant =
    x0Prime * x2Prime <= 0 && y0Prime * y2Prime <= 0;

  if (!signOfGradientIsConstant) {
    return [];
  }

  if (curvature === 0) {
    return [];
  }

  let resolutionFactor: number = 1;
  if (dx0 === 0 || dy0 === 0 || dx2 === 0 || dy2 === 0) {
    resolutionFactor = 1 + Math.abs(dxy / curvature) / 2;
  } else {
    resolutionFactor = Math.max(
      (2 * dxx) / dx0,
      (2 * dyy) / dy0,
      (2 * dxx) / dx2,
      (2 * dyy) / dy2,
      resolutionFactor
    );
  }

  let dxxIter = dxx,
    dyyIter = dyy,
    dxyIter = dxy,
    dxIter = dx0,
    dyIter = dy0;

  if (curvature < 0) {
    dxxIter = -dxxIter;
    dyyIter = -dyyIter;
    dxyIter = -dxyIter;
    dxIter = -dxIter;
    dyIter = -dyIter;
  }

  dxIter = resolutionFactor * dxIter + dxxIter / 2 - dxyIter;
  dyIter = resolutionFactor * dyIter + dyyIter / 2 - dxyIter;

  let error = dxIter + dyIter + dxyIter;

  let resolutionX = resolutionFactor;
  let resolutionY = resolutionFactor;

  let temp: number;
  let x = x0;
  let y = y0;

  const points: Case[] = [];
  let iterations = 10;
  while (iterations--) {
    points.push({ x, y, char: "*" });
    if (x === x2 && y === y2) {
      break;
    }

    do {
      temp = 2 * error - dyIter;
      if (2 * error >= dxIter) {
        resolutionX--;
        dyIter -= dxyIter;
        dxIter += dxxIter;

        error += dxIter;
      }

      if (temp <= 0) {
        resolutionY--;
        dxIter -= dxyIter;
        dyIter += dyyIter;
        error += dyIter;
      }
    } while (resolutionX > 0 && resolutionY > 0);

    if (2 * resolutionX <= resolutionFactor) {
      x += sx;
      resolutionX += resolutionFactor;
    }
    if (2 * resolutionY <= resolutionFactor) {
      y += sy;
      resolutionY += resolutionFactor;
    }
  }

  return points;
}

function fineQuadBezierOpti(p0: Point, p1: Point, p2: Point): Case[] {
  let { x: x0, y: y0 } = p0;
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;

  let sx = x0 < x2 ? 1 : -1,
    sy = y0 < y2 ? 1 : -1; /* step direction */
  let f = 1,
    fx = x0 - 2 * x1 + x2,
    fy = y0 - 2 * y1 + y2;
  let x = 2 * fx * fx,
    y = 2 * fy * fy,
    xy = 2 * fx * fy * sx * sy;
  let cur = sx * sy * (fx * (y2 - y0) - fy * (x2 - x0)); /* curvature */

  /* compute error increments of P0 */
  let dx =
    Math.abs(y0 - y1) * xy - Math.abs(x0 - x1) * y - cur * Math.abs(y0 - y2);
  let dy =
    Math.abs(x0 - x1) * xy - Math.abs(y0 - y1) * x + cur * Math.abs(x0 - x2);
  /* compute error increments of P2 */
  let ex =
    Math.abs(y2 - y1) * xy - Math.abs(x2 - x1) * y + cur * Math.abs(y0 - y2);
  let ey =
    Math.abs(x2 - x1) * xy - Math.abs(y2 - y1) * x - cur * Math.abs(x0 - x2);

  /* sign of gradient must not change */
  const signOfGradientIsConstant =
    (x0 - x1) * (x2 - x1) <= 0 && (y0 - y1) * (y2 - y1) <= 0;
  if (!signOfGradientIsConstant) {
    return [];
    // console.assert((x0 - x1) * (x2 - x1) <= 0 && (y0 - y1) * (y2 - y1) <= 0);
  }
  if (cur == 0) {
    return [];
  } // plotLine(x0,y0, x2,y2); return; } /* straight line */
  /* compute required minimum resolution factor */
  if (dx == 0 || dy == 0 || ex == 0 || ey == 0)
    f = Math.abs(xy / cur) / 2 + 1; /* division by zero: use curvature */
  else {
    fx = (2 * y) / dx;
    if (fx > f) f = fx; /* increase resolution */
    fx = (2 * x) / dy;
    if (fx > f) f = fx;
    fx = (2 * y) / ex;
    if (fx > f) f = fx;
    fx = (2 * x) / ey;
    if (fx > f) f = fx;
  } /* negated curvature? */
  const points: Case[] = [];
  if (cur < 0) {
    x = -x;
    y = -y;
    dx = -dx;
    dy = -dy;
    xy = -xy;
  }
  dx = f * dx + y / 2 - xy;
  dy = f * dy + x / 2 - xy;
  ex = dx + dy + xy; /* error 1.step */
  for (fx = fy = f; ; ) {
    /* plot curve */
    points.push({ x: x0, y: y0, char: "*" });
    //  setPixel(x0,y0);
    if (x0 == x2 && y0 == y2) break;
    do {
      /* move f sub-pixel */
      ey = 2 * ex - dy; /* save value for test of y step */
      if (2 * ex >= dx) {
        fx--;
        dy -= xy;
        ex += dx += y;
      } /* x step */
      if (ey <= 0) {
        fy--;
        dx -= xy;
        ex += dy += x;
      } /* y step */
    } while (fx > 0 && fy > 0); /* pixel complete? */
    if (2 * fx <= f) {
      x0 += sx;
      fx += f;
    } /* sufficient sub-steps.. */
    if (2 * fy <= f) {
      y0 += sy;
      fy += f;
    } /* .. for a pixel? */
  }
  return points;
}