export type Point = { x: number; y: number };
export type Cell = { x: number; y: number; char: string };

type Step = Cell | Cell[] | undefined;

export type Growable = {
  growAll(): void;
  step(i: number): Step;
};

type GrowableFactory = (width: number, height: number) => Growable;
