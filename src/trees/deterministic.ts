const leftBranch = "/";
export class DeterministicTree {
  constructor(private width: number, private height: number) {
    this.width = width;
    this.height = height;
  }

  growAll() {
    console.log("grow");
  }

  /**
   *
   * @param {number} i
   * @returns
   */
  step(
    i: number
  ):
    | { x: number; y: number; c: string; nextTime: number | undefined }
    | undefined {
    if (i < 0 || i > this.width - 1 || i > this.height - 1) return;
    return {
      x: i,
      y: i,
      c: leftBranch,
      nextTime: i > 6 ? 50 - 2 * i : undefined,
    };
  }
}
