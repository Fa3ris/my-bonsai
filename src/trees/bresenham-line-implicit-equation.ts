type Point = {
  x: number;
  y: number;
};

// THEORY
// http://members.chello.at/%7Eeasyfilter/Bresenham.pdf

type Case = { x: number; y: number; char: string };

type Step = Case | undefined;

export class BresenhamLineImplicit {
  constructor() {}
  private list: { x: number; y: number; char: string }[] = [];

  growAll(): void {
    // low slopes
    const l1 = [
      ...this.bresenham({ x: 5, y: 4 }, { x: 30, y: 8 }), // right up
      ...this.bresenham({ x: 25, y: 12 }, { x: 15, y: 15 }), // left up
      ...this.bresenham({ x: 35, y: 15 }, { x: 25, y: 12 }), // left down
    ];
    const l2 = this.bresenham({ x: 5, y: 16 }, { x: 30, y: 10 }); // right down
    const l3 = this.bresenham({ x: 40, y: 18 }, { x: 60, y: 18 });
    const l8 = this.bresenham({ x: 20, y: 2 }, { x: 10, y: 2 });

    // high slopes
    const l4 = [
      ...this.bresenham({ x: 40, y: 1 }, { x: 41, y: 10 }), // right up
      ...this.bresenham({ x: 38, y: 1 }, { x: 39, y: 10 }),
    ];
    const l5 = [
      ...this.bresenham({ x: 54, y: 2 }, { x: 50, y: 15 }), // left up
      ...this.bresenham({ x: 50, y: 2 }, { x: 48, y: 15 }),
    ];
    const l41 = [
      ...this.bresenham({ x: 71, y: 10 }, { x: 70, y: 1 }), // left down
      ...this.bresenham({ x: 69, y: 10 }, { x: 68, y: 1 }), // right down
    ];
    const l6 = this.bresenham({ x: 55, y: 16 }, { x: 57, y: 1 });
    const l7 = this.bresenham({ x: 60, y: 16 }, { x: 60, y: 1 });
    this.list = [
      ...l1,
      ...l2,
      ...l3,
      ...l4,
      ...l5,
      ...l6,
      ...l7,
      ...l8,
      ...l41,
    ];
  }

  /**
   *
   * implicit equation
   * given 2 points (x1, y1), (x0, y0)
   * the equation is
   * (x1 - x0)*(y - y0) - (x - x0)*(y1 - y0) = 0
   * let dx = x1 - x0
   * dy = y1 - y0
   *
   * => dx*(y - y0) - dy*(x - x0) = 0
   * define error e = dx*(y - y0) - dy*(x - x0)
   *
   * exy => error we get if increase both x and y
   * ex => error if we increase only y
   * ey => error if we increase only x
   *
   * by replacing the terms we get
   * exy = dx*(y+ 1 - y0) - dy(x+ 1 - x0) =  e + dx - dy
   *
   * ex = dx*(y + 1 - y0) - dy*(x - x0) = exy + dy
   * ey = dx*(y - y0) - dy*(x + 1 - x0) = exy - dx
   *
   * the rules are
   * at one step, given exy
   * compute ex = exy + dy
   * if exy + ex > 0
   * <=> 2*exy + dy > 0, then increase x and substract the surplus dy
   *
   * compute ey = exy - dx
   * if exy + ey < 0
   * <=> 2*exy - dx < 0, then increase y and add the surplus dx
   *
   *
   *
   * @param start
   * @param end
   * @returns
   */
  bresenham(start: Point, end: Point): Case[] {
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

    const char = highSlope ? "|" : "_";

    while (true) {
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
          cases[i - 1].char = moveLeftDown ? "/" : "\\";
        } else if (moveRight) {
          const moveRightDown = incY < 0;
          cases[i].char = moveRightDown ? "\\" : "/";
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
          cases[i].char = moveDownRight ? "\\" : "/";
        } else if (moveUp) {
          const moveUpRight = incX > 0;
          cases[i - 1].char = moveUpRight ? "/" : "\\";
        }
      }
    }

    return cases;
  }

  step(i: number): Step {
    if (i < 0 || i > this.list.length) return undefined;
    return this.list[i];
  }
}
