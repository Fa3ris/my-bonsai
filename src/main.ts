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
bonsaiWithControls2((width, height) => new Bonsai2(width, height));