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

/*
https://www.research-collection.ethz.ch/bitstream/handle/20.500.11850/68976/eth-3201-01.pdf?sequence=1&isAllowed=y

find the 4 vertices of the rectangle enclosing the line

then fill the rectangle using scanline fill algorithm

see also https://web.cs.ucdavis.edu/~ma/ECS175_S00/Notes/0411_b.pdf
for special cases
*/
export function lineThick(start: Point, end: Point, width: number): Point[] {

  width = Math.max(1, Math.round(width));
  if (width <= 1) { return line(start, end); }

  const dy = end.y - start.y;
  const dx = end.x - start.x;
  const length = Math.sqrt(dy * dy + dx * dx);

  const lineIncX = Math.round((width * dy) / (2 * length));
  const lineIncY = Math.round((width * dx) / (2 * length));

  const lineVert1: Point = { x: start.x + lineIncX, y: start.y - lineIncY, };
  const lineVert3: Point = { x: end.x + lineIncX, y: end.y - lineIncY, };

  const widthUp = Math.max(1, width - 1);
  const lineIncX1 = Math.round((widthUp * dy) / (2 * length));
  const lineIncY1 = Math.round((widthUp * dx) / (2 * length));

  const lineVert2: Point = { x: start.x - lineIncX1, y: start.y + lineIncY1, };
  const lineVert4: Point = { x: end.x - lineIncX1, y: end.y + lineIncY1, };

  const vertices = [lineVert1, lineVert2, lineVert4, lineVert3];

  return scanLineFill(vertices, [0, 1, 1, 2, 2, 3, 3, 0]);

}

function scanLineFill(vertices: Point[], order: number[]): Point[] {
  const points: Point[] = [];

  const edgeTable: Edge[] = [];

  for (let i = 0; i < order.length - 1; i += 2) {
    edgeTable.push(makeEdge(vertices[order[i]], vertices[order[i + 1]]));
  }
  // from min yMin to max yMax
  edgeTable.sort((a, b) => a.yMin - b.yMin);

  const lastEdge = edgeTable.at(-1)!;

  const activeEdgeTable: Edge[] = [];

  let scanY = edgeTable[0].yMin;

  while (activeEdgeTable.length > 0 || edgeTable.length > 0) {

    // activate edges that are intersecting the scan line
    for (let j = edgeTable.length - 1; j >= 0; j--) {
      if (edgeTable[j].yMin === scanY) {
        activeEdgeTable.push(edgeTable[j]);
        edgeTable.splice(j, 1);
      }
    }

    activeEdgeTable.sort((a, b) => a.x - b.x);

    // fill the pixels between consecutive edges
    for (let j = 0; j < activeEdgeTable.length - 1; j+=2) {
      const edge = activeEdgeTable[j];
      const edge2 = activeEdgeTable[j + 1];
      for (let x = Math.round(edge.x); x <= Math.round(edge2.x); x++) {
        points.push({ x, y: scanY });
      }
    }

    scanY++;

    // remove edges that have been completely scanned 
    for (let j = activeEdgeTable.length - 1; j >= 0; j--) {
      if (activeEdgeTable[j].yMax === scanY) {
         activeEdgeTable.splice(j, 1);
      }
    }

    // compute next x using the slope equation m = (yNew - yOld) / (xNew - xOld)
    // xNew = xOld + (yNew - yOld) / m
    // and yNew = yOld + 1 since we move the line up by 1
    // xNew = xOld + 1/m
    for (const edge of activeEdgeTable) {
      edge.x += edge.invertSlope;
    }
  }

  // add the vertex with highest y to the points since it is not added
  points.push({ x: lastEdge.xOfYMax, y: lastEdge.yMax})

  return points;
}

type Edge = {
  yMin: number;
  yMax: number;
  x: number;
  invertSlope: number;
  // used to find the vertex with highest y
  xOfYMax: number;
};

function makeEdge(p1: Point, p2: Point): Edge {
  const yMin = Math.min(p1.y, p2.y);
  const yMax = Math.max(p1.y, p2.y);
  const [x, xOfYMax] = p1.y > p2.y ? [p2.x, p1.x] : [p1.x, p2.x];
  const invertSlope = (p2.x - p1.x) / (p2.y - p1.y);
  return { yMin, yMax, x, invertSlope, xOfYMax };
}
