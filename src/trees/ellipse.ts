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
      ...ellipse({ x: 35, y: 10 }, 12, 9),
      ...ellipseArc(
        { x: 65, y: 10 },
        12,
        9,
        Math.PI / 4,
        (3 * Math.PI) / 2 - (2 * Math.PI) / 8
      ),
    ];
    this.list = [...l1];
  }

  step(i: number): Step {
    if (i < 0 || i > this.list.length) return undefined;
    return this.list[i];
  }
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
    firstQuadrant.push({ x: xm - x, y: ym + y, char: "*" });
    secondQuadrant.push({ x: xm + x, y: ym + y, char: "&" });
    thirdQuadrant.push({ x: xm + x, y: ym - y, char: "$" });
    fourthQuadrant.push({ x: xm - x, y: ym - y, char: "@" });

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
    secondQuadrant.push({ x: xm, y: ym + y, char: "#" });
    fourthQuadrant.push({ x: xm, y: ym - y, char: "%" });
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
