import path from "path";
import { Growable } from "../draw/bonsai-with-controls";

type Point = {
  x: number;
  y: number;
};

type Case = { x: number; y: number; char: string };
type Step = Case | undefined;

export class BezierParametricEquation implements Growable {
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
        { x: 0 + 7, y: 0 },
        { x: 4 + 7, y: 2 },
        { x: 11 + 7, y: 7 },
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
        { x: 0, y: 12 },
      ],
      [
        { x: 0, y: 9 },
        { x: 16, y: 11 },
        { x: 19, y: 1 },
      ],
    ];

    const l3 = [
      ...vertices.flatMap((v) => adaptativeBezierQuad(v[0], v[1], v[2], 0, 1)),
    ];
    this.list = [...l3];
  }

  step(i: number): Step {
    if (i < 0 || i > this.list.length) return undefined;
    return this.list[i];
  }
}

function bezierDeCasteljau(p0: Point, p1: Point, p2: Point): Case[] {
  const steps = 100;

  const invertStep = 1 / steps;
  const points: Point[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i * invertStep;

    const pt = getBezierQuadPoint([p0, p1, p2], t);

    const prev = points.at(-1);

    console.log("prev", prev, "pt", pt, points);
    if (prev) {
      const diffX = Math.abs(prev.x - Math.round(pt.x));
      const diffY = Math.abs(prev.y - Math.round(pt.y));
      if (diffX === 0 && diffY === 0) {
        console.warn("skipping", { diffX, diffY });
        continue;
      }
    }

    console.log("pt", t, pt);
    console.log("rounded", { x: Math.round(pt.x), y: Math.round(pt.y) });
    points.push({ x: Math.round(pt.x), y: Math.round(pt.y) });
  }

  return points.map(({ x, y }) => ({
    x,
    y,
    char: "*",
  }));
}

function digitalDifferentialAnalyzer(start: Point, end: Point): Case[] {
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const steps = Math.max(dx, dy);

  const xIncrement = (end.x - start.x) / steps;
  const yIncrement = (end.y - start.y) / steps;

  const cases: Case[] = [];
  let x = start.x;
  let y = start.y;
  for (let i = 0; i < steps; i++) {
    cases.push({ x: Math.trunc(x), y: Math.trunc(y), char: "*" });
    x += xIncrement;
    y += yIncrement;
  }

  return cases;
}

function adaptativeBezierQuad(
  p0: Point,
  p1: Point,
  p2: Point,
  tStart: number,
  tEnd: number
): Case[] {
  const tMid = tStart + (tEnd - tStart) / 2;

  // TODO: start from 0 and t = 0.1, compute next point and curvature,
  // then compute next t depending on curvature, and so on until t >= 1;
  if (tMid - tStart < 1e-1 || tEnd - tMid < 1e-1) {
    const a = getBezierQuadPoint([p0, p1, p2], tStart);
    const b = getBezierQuadPoint([p0, p1, p2], tEnd);
    console.warn(
      "too close - draw line",
      { x: Math.round(a.x), y: Math.round(a.y) },
      { x: Math.round(b.x), y: Math.round(b.y) }
    );
    return digitalDifferentialAnalyzer(a, b).filter((point) =>
      isCloseToCurve(point, tStart, tEnd, p0, p1, p2, 0.5, 5)
    );
    // get the bezier points in float
    // between two points, get bresenham line
    // for each pixel, subdivide the pixel into a grid (4x4)
    // for each subpixel, compute distance to the bezier curve (how?)
    // if distance is less than threshold, consider the subpixel is covered
    // if enough subpixels are covered, consider the pixel is covered

    // ou simplement https://fr.wikipedia.org/wiki/Analyseur_diff%C3%A9rentiel_num%C3%A9rique
    // pour tracer le segment
  }

  console.log("tstart", tStart, "tMid", tMid, "tEnd", tEnd);
  const curvatureAt = curvatureBezierQuadratic(p0, p1, p2);

  const c0 = curvatureAt(tStart);
  const c1 = curvatureAt(tMid);
  const c2 = curvatureAt(tEnd);

  const threshold = 0.1;

  const maxCurvature = Math.max(Math.abs(c0), Math.abs(c1), Math.abs(c2));

  console.log("curvature", { c0, c1, c2, maxCurvature });

  const isCurveFlatEnough = maxCurvature < threshold;
  if (isCurveFlatEnough) {
    if (tEnd - tStart > 0.9) {
      return digitalDifferentialAnalyzer(p0, p2);
    }
    console.warn("maxCurvature < threshold", { maxCurvature, threshold });
    const a = getBezierQuadPoint([p0, p1, p2], tStart);
    const b = getBezierQuadPoint([p0, p1, p2], tEnd);
    console.warn(
      "flat enough - draw line",
      { x: Math.round(a.x), y: Math.round(a.y) },
      { x: Math.round(b.x), y: Math.round(b.y) }
    );
    return digitalDifferentialAnalyzer(a, b).filter((point) =>
      isCloseToCurve(point, tStart, tEnd, p0, p1, p2, 0.5, 5)
    );
  }

  const firstHalf = adaptativeBezierQuad(p0, p1, p2, tStart, tMid);
  const secondHalf = adaptativeBezierQuad(p0, p1, p2, tMid, tEnd);
  return [...firstHalf, ...secondHalf].filter((item, index, arr) => {
    return (
      index === 0 || item.x !== arr[index - 1].x || item.y !== arr[index - 1].y
    );
  });
}

function isCloseToCurve(
  pixel: Case,
  tStart: number,
  tEnd: number,
  p0: Point,
  p1: Point,
  p2: Point,
  distanceThreshold: number,
  countThreshold: number
): boolean {
  const subX = [pixel.x, pixel.x + 0.25, pixel.x + 0.5, pixel.x + 0.75];
  const subY = [pixel.y, pixel.y + 0.25, pixel.y + 0.5, pixel.y + 0.75];

  const pStart = getBezierQuadPoint([p0, p1, p2], tStart);
  const tMid = (tStart + tEnd) / 2;
  const pMid = getBezierQuadPoint([p0, p1, p2], tMid);

  const tFourth = (tMid + tStart) / 2;
  const pFourth = getBezierQuadPoint([p0, p1, p2], tFourth);

  const tThreeFourth = (tMid + tEnd) / 2;
  const pThreeFourth = getBezierQuadPoint([p0, p1, p2], tThreeFourth);

  const pEnd = getBezierQuadPoint([p0, p1, p2], tEnd);
  const curvePoints = [pStart, pMid, pFourth, pThreeFourth, pEnd];

  const subPixels = subX.flatMap((x) => subY.map((y) => ({ x, y })));
  const subPixelsWithin = subPixels.filter((pixel) => {
    const dist = Math.min(
      ...curvePoints.map((p) =>
        Math.sqrt((p.x - pixel.x) ** 2 + (p.y - pixel.y) ** 2)
      )
    );
    return dist < distanceThreshold;
  }).length;
  console.log(pixel, { tStart, tEnd }, "subPixelsWithin", subPixelsWithin);

  return subPixelsWithin > countThreshold;
}

function getBezierQuadPoint(points: Point[], t: number): Point {
  if (t === 0) {
    return points[0];
  }
  if (t === 1) {
    return points[points.length - 1];
  }
  if (points.length === 1) {
    return points[0];
  }

  const newPoints: Point[] = Array(points.length - 1);
  for (let i = 0; i < newPoints.length; i++) {
    const x = (1 - t) * points[i].x + t * points[i + 1].x;
    const y = (1 - t) * points[i].y + t * points[i + 1].y;
    newPoints[i] = { x, y };
  }
  return getBezierQuadPoint(newPoints, t);
}

function bresenham(start: Point, end: Point, defaultChar = "*"): Case[] {
  if (start.x === end.x && start.y === end.y) {
    return [];
  }
  const { x: x0, y: y0 } = start;
  const { x: x1, y: y1 } = end;

  const dx = Math.abs(x0 - x1);
  const dy = Math.abs(y0 - y1);
  const incX = Math.sign(x1 - x0);
  const incY = Math.sign(y1 - y0);

  const highSlope = dy > dx;

  let x = x0;
  let y = y0;

  let e_xy = dx - dy;
  const cases: Case[] = [];

  const char = defaultChar || (highSlope ? "|" : "_");

  while (true) {
    if (cases.length > 10) {
      return cases;
    }
    cases.push({ x, y, char: char });
    const e_x = e_xy + dy;
    if (e_xy + e_x > 0) {
      if (x === x1) break;
      e_xy -= dy;
      x += incX;
    }
    const e_y = e_xy - dx;
    if (e_xy + e_y < 0) {
      if (y === y1) break;
      e_xy += dx;
      y += incY;
    }
  }

  if (highSlope) {
    for (let i = 1; i < cases.length - 1; i++) {
      const { x } = cases[i];
      const { x: xPrev } = cases[i - 1];
      const moveLeft = x < xPrev;
      const moveRight = x > xPrev;
      if (moveLeft) {
        const moveLeftDown = incY < 0;
        cases[i - 1].char = defaultChar || (moveLeftDown ? "/" : "\\");
      } else if (moveRight) {
        const moveRightDown = incY < 0;
        cases[i].char = defaultChar || (moveRightDown ? "\\" : "/");
      }
    }
  } else {
    for (let i = 1; i < cases.length - 1; i++) {
      const { y } = cases[i];
      const { y: yPrev } = cases[i - 1];
      const moveDown = y < yPrev;
      const moveUp = y > yPrev;
      if (moveDown) {
        const moveDownRight = incX > 0;
        cases[i].char = defaultChar || (moveDownRight ? "\\" : "/");
      } else if (moveUp) {
        const moveUpRight = incX > 0;
        cases[i - 1].char = defaultChar || (moveUpRight ? "/" : "\\");
      }
    }
  }

  return cases;
}

function curvatureBezierQuadratic(p0: Point, p1: Point, p2: Point) {
  const first = firstDerivativeBezierQuadratic(p0, p1, p2);
  const second = secondDerivativeBezierQuadratic(p0, p1, p2);
  return (t: number) => {
    const numerator = first.x(t) * second.y() - first.y(t) * second.x();
    const denominator = Math.pow(first.x(t) ** 2 + first.y(t) ** 2, 1.5);
    return numerator / denominator;
  };
}

function firstDerivativeBezierQuadratic(p0: Point, p1: Point, p2: Point) {
  return {
    x(t: number) {
      return 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    },
    y(t: number) {
      return 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    },
  };
}

function secondDerivativeBezierQuadratic(p0: Point, p1: Point, p2: Point) {
  return {
    x() {
      return 2 * (p0.x - 2 * p1.x + p2.x);
    },
    y() {
      return 2 * (p0.y - 2 * p1.y + p2.y);
    },
  };
}
