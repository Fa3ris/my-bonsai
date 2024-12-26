type Point = {
  x: number;
  y: number;
};

// THEORY
// http://members.chello.at/%7Eeasyfilter/Bresenham.pdf

type Case = { x: number; y: number; char: string };

type Step = Case | undefined;

export class EllipsisImplicitEquation {
  constructor() {}
  private list: { x: number; y: number; char: string }[] = [];

  growAll(): void {
    const l1 = [
      ...ellipse({ x: 15, y: 10 }, 11, 5),
      ...ellipse({ x: 25, y: 3 }, 2, 2),
      ...ellipse({ x: 30, y: 3 }, 1, 1),
      ...ellipse({ x: 50, y: 7 }, 2, 1),
      ...ellipse({ x: 35, y: 10 }, 12, 9),
      ...ellipseArc(
        { x: 65, y: 10 },
        12,
        9,
        Math.PI / 4,
        (3 * Math.PI) / 2 - (2 * Math.PI) / 8
      ),
      ...ellipseArc({ x: 65, y: 10 }, 5, 4, Math.PI / 4, (3 * Math.PI) / 4),
      ...ellipseFilled({ x: 40, y: 8 }, 7, 3),
      ...ellipseFilled({ x: 22, y: 13 }, 10, 3, "&"),
      ...circle({ x: 28, y: 10 }, 4),
      ...circle({ x: 65, y: 7 }, 7),
      ...circleFilled({ x: 67, y: 5 }, 4),
    ];
    this.list = [...l1];
  }

  step(i: number): Step {
    if (i < 0 || i > this.list.length) return undefined;
    return this.list[i];
  }
}

// equations simplify because minor axis = major axis = radius
function circle(center: Point, r: number): Case[] {
  const { x: xm, y: ym } = center;
  const secondQuadrant: Case[] = [];
  const firstQuadrant: Case[] = [];
  const thirdQuadrant: Case[] = [];
  const fourthQuadrant: Case[] = [];
  let x = -r;
  let y = 0;

  let e_xy = 2 - 2 * r;
  do {
    firstQuadrant.push({ x: xm - x, y: ym + y, char: "_" });
    secondQuadrant.push({ x: xm + x, y: ym + y, char: "_" });
    thirdQuadrant.push({ x: xm + x, y: ym - y, char: "_" });
    fourthQuadrant.push({ x: xm - x, y: ym - y, char: "_" });
    const prevE_xy = e_xy;

    let yInc = false;
    if (prevE_xy < y + 0.5) {
      y++;
      e_xy += 2 * y + 1;
      yInc = true;
    }
    const yStepWasNotEnoughToAdjustErr = yInc && e_xy >= y + 0.5;
    if (prevE_xy > x + 0.5 || yStepWasNotEnoughToAdjustErr) {
      x++;
      e_xy += 2 * x + 1;
    }
  } while (x < 0);

  secondQuadrant.reverse();
  fourthQuadrant.reverse();

  return [
    ...firstQuadrant,
    ...secondQuadrant,
    ...thirdQuadrant,
    ...fourthQuadrant,
  ];
}

function ellipse(center: Point, majorAxis: number, minorAxis: number): Case[] {
  const { x: xm, y: ym } = center;
  const secondQuadrant: Case[] = [];
  const firstQuadrant: Case[] = [];
  const thirdQuadrant: Case[] = [];
  const fourthQuadrant: Case[] = [];

  const a = Math.abs(majorAxis);
  const b = Math.abs(minorAxis);

  // draw second quadrant from (-a, 0) to (0, b)
  // the other quadrants are symmetric

  let x = -a;
  let y = 0;
  const a2 = a * a;
  const b2 = b * b;

  let e_xy = a2 - (2 * a - 1) * b2;

  while (true) {
    firstQuadrant.push({ x: xm - x, y: ym + y, char: "_" });
    secondQuadrant.push({ x: xm + x, y: ym + y, char: "_" });
    thirdQuadrant.push({ x: xm + x, y: ym - y, char: "_" });
    fourthQuadrant.push({ x: xm - x, y: ym - y, char: "_" });

    const e_x = e_xy - (2 * x + 1) * b2;
    if (e_xy + e_x > 0) {
      if (x === 0) break;
      x++;
      e_xy += (2 * x + 1) * b2;
    }

    const e_y = e_xy - (2 * y + 1) * a2;
    if (e_xy + e_y < 0) {
      if (y === b) break;
      y++;
      e_xy += (2 * y + 1) * a2;
    }
  }

  while (y < b) {
    y++;
    secondQuadrant.push({ x: xm, y: ym + y, char: "_" });
    fourthQuadrant.push({ x: xm, y: ym - y, char: "_" });
  }

  secondQuadrant.reverse();
  fourthQuadrant.reverse();

  return [
    ...firstQuadrant,
    ...secondQuadrant,
    ...thirdQuadrant,
    ...fourthQuadrant,
  ];
}

function ellipseArc(
  center: Point,
  majorAxis: number,
  minorAxis: number,
  angleStart: number,
  angleEnd: number
): Case[] {
  const { x: xm, y: ym } = center;
  const cases = ellipse(center, majorAxis, minorAxis);
  const withinAngle = (point: Point): boolean => {
    const { x, y } = point;
    const rawAngle = Math.atan2(y - ym, x - xm);
    const angle = rawAngle > 0 ? rawAngle : rawAngle + 2 * Math.PI;
    return angleStart <= angle && angle <= angleEnd;
  };
  const filtered = cases.filter(withinAngle);
  return filtered;
}

function ellipseFilled(
  center: Point,
  majorAxis: number,
  minorAxis: number,
  char: string = "*"
): Case[] {
  const { x: xm, y: ym } = center;
  const cases = ellipse(center, majorAxis, minorAxis);

  const visited: Set<string> = new Set(cases.map((c) => `${c.x};${c.y}`));

  const toKey = (p: Point): string => `${p.x};${p.y}`;
  const stack: Point[] = [{ x: xm, y: ym }];

  const maxAxis = Math.max(majorAxis, minorAxis);

  const minX = center.x - maxAxis;
  const maxX = center.x + maxAxis;
  const minY = center.y - maxAxis;
  const maxY = center.y + maxAxis;

  while (stack.length) {
    const p = stack.pop()!;
    const key = toKey(p);

    if (
      p.x < minX ||
      p.x > maxX ||
      p.y < minY ||
      p.y > maxY ||
      p.y < 0 ||
      visited.has(key)
    ) {
      continue;
    }

    visited.add(key);
    cases.push({ ...p, char });

    stack.push(
      { x: p.x - 1, y: p.y },
      { x: p.x + 1, y: p.y },
      { x: p.x, y: p.y - 1 },
      { x: p.x, y: p.y + 1 }
    );
  }

  return cases;
}

function circleFilled(center: Point, r: number, char: string = "*"): Case[] {
  const { x: xm, y: ym } = center;
  const cases = circle(center, r);

  const visited: Set<string> = new Set(cases.map((c) => `${c.x};${c.y}`));

  const toKey = (p: Point): string => `${p.x};${p.y}`;
  const stack: Point[] = [{ x: xm, y: ym }];

  const minX = center.x - r;
  const maxX = center.x + r;
  const minY = center.y - r;
  const maxY = center.y + r;

  while (stack.length) {
    const p = stack.pop()!;
    const key = toKey(p);

    if (
      p.x < minX ||
      p.x > maxX ||
      p.y < minY ||
      p.y > maxY ||
      p.y < 0 ||
      visited.has(key)
    ) {
      continue;
    }

    visited.add(key);
    cases.push({ ...p, char });

    stack.push(
      { x: p.x - 1, y: p.y },
      { x: p.x + 1, y: p.y },
      { x: p.x, y: p.y - 1 },
      { x: p.x, y: p.y + 1 }
    );
  }

  return cases;
}