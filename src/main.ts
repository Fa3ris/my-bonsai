import { bonsaiWithControls } from "./draw/bonsai-with-controls";
import { drawDeterministicTree } from "./draw/deterministic";
import { drawFirstTree } from "./draw/first";
import { drawGridCorners } from "./draw/grid-corners";
import { drawRandomTree } from "./draw/random";
import { randomTreeWithControls } from "./draw/random-with-controls";
import { Bonsai } from "./trees/bonsai";

if (document.body.querySelector("#DEBUG")) {
  drawGridCorners();
}

drawFirstTree();

if (document.body.querySelector("#DEBUG")) {
  drawDeterministicTree();
}

drawRandomTree();

randomTreeWithControls();

bonsaiWithControls();


bonsaiWithControls((width, height) => new Bonsai(width, height));
