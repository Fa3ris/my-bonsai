import { Point } from "../types";

export function line(start: Point, end: Point): Point[] {
  const slopeIsHigh = Math.abs(end.y - start.y) > Math.abs(end.x - start.x);

  if (slopeIsHigh) {
    if (start.y > end.y) return bresenhamHighSlope(end, start);
    return bresenhamHighSlope(start, end);
  }

  if (start.x > end.x) return bresenhamLowSlope(end, start);
  return bresenhamLowSlope(start, end);
}

function bresenhamHighSlope(start: Point, end: Point): Point[] {
  const { x: x0, y: y0 } = start;
  const { x: x1, y: y1 } = end;
  const dx = Math.abs(x1 - x0);
  const dy = y1 - y0;
  let error = 2 * dx - dy;
  let x = x0;
  const xInc = Math.sign(x1 - x0);

  const points: Point[] = [];
  for (let y = y0; y <= y1; y++) {
    points.push({ x, y });
    if (error > 0) {
      x += xInc;
      error -= 2 * dy;
    }
    error += 2 * dx;
  }

  return points;
}

function bresenhamLowSlope(start: Point, end: Point): Point[] {
  const { x: x0, y: y0 } = start;
  const { x: x1, y: y1 } = end;
  const dx = x1 - x0;
  const sDy = Math.sign(y1 - y0);
  const dy = Math.abs(y1 - y0);
  let error = 2 * dy - dx;
  let y = y0;
  const yInc = sDy;

  const points: Point[] = [];
  for (let x = x0; x <= x1; x++) {
    points.push({ x, y });
    if (error > 0) {
      y += yInc;
      error -= 2 * dx;
    }
    error += 2 * dy;
  }

  return points;
}
