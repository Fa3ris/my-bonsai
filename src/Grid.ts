const blank = " ";

export class Grid {
  private grid: string[];
  constructor(private readonly w: number, private readonly h: number) {
    this.grid = Array(w * h).fill(blank);
  }

  set(x: number, y: number, c: string) {
    this.grid[(this.h - 1 - y) * this.w + x] = c;
  }

  reset() {
    this.grid = Array(this.w * this.h).fill(blank);
  }

  toString() {
    const rendered = [...Array(this.h)]
      .map((_, row) => {
        return this.grid
          .slice((this.h - 1 - row) * this.w, (this.h - row) * this.w)
          .join("");
      })
      .reverse()
      .join("\n");
    return rendered;
  }
}
