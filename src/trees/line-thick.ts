import { lineThick } from "../draw/line";
import { Growable } from "../types";

export class BresenhamLineThick implements Growable {
  constructor() {}
  private list: { x: number; y: number; char: string }[] = [];

  growAll(): void {
    this.list = [
      ...lineThick({ x: 5, y: 4 }, { x: 20, y: 5 }, 4).map((p) => ({
        x: p.x,
        y: p.y,
        char: "#",
      })),
      ...lineThick({ x: 20, y: 13 }, { x: 25, y: 10 }, 3).map((p) => ({
        x: p.x,
        y: p.y,
        char: "#",
      })),
      ...lineThick({ x: 30, y: 13 }, { x: 35, y: 10 }, 5).map((p) => ({
        x: p.x,
        y: p.y,
        char: "#",
      })),
      ...lineThick({ x: 30, y: 13 }, { x: 55, y: 3 }, 3).map((p) => ({
        x: p.x,
        y: p.y,
        char: "#",
      })),
      ...lineThick({ x: 30, y: 3 }, { x: 55, y: 13 }, 1).map((p) => ({
        x: p.x,
        y: p.y,
        char: "#",
      })),
    ];
  }

  step(i: number) {
    if (i < 0 || i > this.list.length) return undefined;
    return this.list[i];
  }
}
