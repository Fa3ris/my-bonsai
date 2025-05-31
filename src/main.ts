import { bonsaiWithControls } from "./draw/bonsai-with-controls";
import { drawDeterministicTree } from "./draw/deterministic";
import { drawFirstTree } from "./draw/first";
import { drawGridCorners } from "./draw/grid-corners";
import { drawRandomTree } from "./draw/random";
import { randomTreeWithControls } from "./draw/random-with-controls";
import { Bonsai } from "./trees/bonsai";
import { BresenhamLineImplicit } from "./trees/bresenham-line-implicit-equation";
import { BresenhamLine } from "./trees/bresenham-line";
import { EllipsisImplicitEquation } from "./trees/ellipse";
import { BezierImplicitEquation } from "./trees/bezier";
import { BezierParametricEquation } from "./trees/bezier-parametric";
import { bonsaiWithControls2 } from "./draw/bonsai-with-controls-2";
import { Bonsai2 } from "./trees/bonsai2";
import { Bonsai3 } from "./trees/bonsai3";
import { BresenhamLineThick } from "./trees/line-thick";
const DEBUG = document.body.querySelector("#DEBUG");
if (DEBUG) {
  drawGridCorners();
  drawFirstTree();
  drawDeterministicTree();
  drawRandomTree();

  randomTreeWithControls();

  bonsaiWithControls((width, height) => new Bonsai(width, height));
  bonsaiWithControls((width, height) => new BresenhamLine(width, height));
  bonsaiWithControls(() => new BresenhamLineImplicit());
  bonsaiWithControls(() => new EllipsisImplicitEquation());
  bonsaiWithControls(() => new BezierImplicitEquation());
  bonsaiWithControls(() => new BezierParametricEquation());
}

bonsaiWithControls();
bonsaiWithControls2(() => new BezierParametricEquation());
bonsaiWithControls2((width, height) => new Bonsai2(width, height)).loop();
bonsaiWithControls2(
  (width, height) =>
    new Bonsai3(width, height, {
      maxLayer: 5,
      displayCells: [2, 4],
      root: {
        x: Math.round(width / 2),
        y: 1,
        length: 1,
        angle: 0,
      },
      generateBranches: {
        number: [2, 3],
        length: [4, 8],
        angle: [30, 45],
        leaves: 10,
        branchChar: "1",
        leafChar: "0",
      },
    })
).loop();

bonsaiWithControls2(() => new BresenhamLineThick()).end();
bonsaiWithControls2((w, h) => new BresenhamLine(w, h)).end();