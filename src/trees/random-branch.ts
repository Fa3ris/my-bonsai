type Point = {
  x: number;
  y: number;
};

type Case = { x: number; y: number; char: string };

type Step = Case | undefined;

export class RandBranch {
  constructor(w: number, h: number) {}
  private list: { x: number; y: number; char: string }[] = [];

  growAll(): void {
    // low slopes
    const l1 = this.bresenham({ x: 5, y: 4 }, { x: 30, y: 8 });
    const l2 = this.bresenham({ x: 5, y: 16 }, { x: 30, y: 10 });
    const l3 = this.bresenham({ x: 40, y: 18 }, { x: 60, y: 18 });
    const l8 = this.bresenham({ x: 20, y: 2 }, { x: 10, y: 2 });

    // high slopes
    const l4 = [
      ...this.bresenham({ x: 40, y: 1 }, { x: 41, y: 10 }),
      ...this.bresenham({ x: 38, y: 1 }, { x: 39, y: 10 }),
    ];
    const l5 = [
      ...this.bresenham({ x: 54, y: 2 }, { x: 50, y: 15 }),
      ...this.bresenham({ x: 50, y: 2 }, { x: 48, y: 15 }),
    ];
    const l6 = this.bresenham({ x: 55, y: 16 }, { x: 57, y: 1 });
    const l7 = this.bresenham({ x: 60, y: 16 }, { x: 60, y: 1 });
    this.list = [...l1, ...l2, ...l3, ...l4, ...l5, ...l6, ...l7, ...l8];
  }

  bresenham(start: Point, end: Point): Case[] {
    const slopeIsHigh = Math.abs(end.y - start.y) > Math.abs(end.x - start.x);

    if (slopeIsHigh) {
      if (start.y > end.y) return this.bresenhamHighSlope(end, start);
      return this.bresenhamHighSlope(start, end);
    }

    if (start.x > end.x) return this.bresenhamLowSlope(end, start);

    return this.bresenhamLowSlope(start, end);
  }

  bresenhamHighSlope(start: Point, end: Point): Case[] {
    const { x: x0, y: y0 } = start;
    const { x: x1, y: y1 } = end;
    const dx = Math.abs(x1 - x0);
    const dy = y1 - y0;
    let error = 2 * dx - dy;
    let x = x0;
    const xInc = Math.sign(x1 - x0);

    const points: Case[] = [];
    for (let y = y0; y <= y1; y++) {
      points.push({ x, y, char: "|" });
      if (error > 0) {
        x += xInc;
        error -= 2 * dy;
      }
      error += 2 * dx;
    }

    for (let i = points.length - 1; i > 0; i--) {
      const { x: x } = points[i];
      const { x: xPrev } = points[i - 1];
      if (x < xPrev) {
        points[i - 1].char = "\\";
      } else if (x > xPrev) {
        points[i].char = "/";
      }
    }

    return points;
  }

  bresenhamLowSlope(start: Point, end: Point): Case[] {
    const { x: x0, y: y0 } = start;
    const { x: x1, y: y1 } = end;
    const dx = x1 - x0;
    const sDy = Math.sign(y1 - y0);
    const dy = Math.abs(y1 - y0);
    let error = 2 * dy - dx;
    let y = y0;
    const yInc = sDy;

    const points: Case[] = [];
    for (let x = x0; x <= x1; x++) {
      points.push({ x, y, char: "_" });
      if (error > 0) {
        y += yInc;
        error -= 2 * dx;
      }
      error += 2 * dy;
    }

    for (let i = points.length - 1; i > 0; i--) {
      const { y } = points[i];
      const { y: yPrev } = points[i - 1];
      if (y < yPrev) {
        points[i].char = "\\";
      } else if (y > yPrev) {
        points[i - 1].char = "/";
      }
    }

    return points;
  }

  step(i: number): Step {
    if (i < 0 || i > this.list.length) return undefined;
    return this.list[i];
  }
}
