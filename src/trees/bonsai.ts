const SectionType = {
  upward: 0,
  upLeft: 1,
  upRight: 2,
  left: 3,
  right: 4,
} as const;
type SectionType = (typeof SectionType)[keyof typeof SectionType];
type Leaf = { x: number; y: number };

const TRUNK = "trunk";
const BRANCH = "branch";
const LEAF = "leaf";

/*

pass a generator to the class so we can fake it

to randomize / configure
when/to where branch out from trunk
which branch target to reach
when branch splits
rate of growth of section - do not grow on each turn - if young can grow easily


time: set when case should appear

*/

type RENDER =
  | "/    \\"
  | "\\   \\"
  | "/   /"
  | "-"
  | "_"
  | "/ /"
  | "//"
  | "/"
  | "&";

type Section = TrunkSection | LeafSection | BranchSection;

function* idMaker(type: string): Generator<number, void, never> {
  let index = 0;
  while (true) {
    const newId = ++index;
    console.log(`${type}: gen id ${newId}`);
    yield newId;
  }
}

const branchIdGen = idMaker("branch");
const trunkIdGen = idMaker("trunk");
const generationIdGen = idMaker("generation");

type BaseSection = {
  id: number;
  x: number;
  y: number;
  age: number;
  thresholdToSplit: number;
  toGrow: number;
  width: number;
  time: number;
  life: number;
};

type TrunkSection = BaseSection & {
  type: Extract<
    SectionType,
    | typeof SectionType.upward
    | typeof SectionType.upLeft
    | typeof SectionType.upRight
  >;
  element: typeof TRUNK;
};

type Target = { x: number; y: number };

type BranchSection = BaseSection & {
  type: SectionType;
  element: typeof BRANCH;
  target: Target;
  generation: number;
  branchChar?: string;
};

type LeafSection = BaseSection & {
  element: typeof LEAF;
};

type Case = { x: number; y: number; char: string };

export class Bonsai {
  private list: (Case | Case[])[];

  private leaves: Case[];
  constructor(private width: number, private height: number) {
    this.list = [];
    this.leaves = [];
  }

  private setCase(x: number, y: number, char: string) {
    this.list.push({ x, y, char });
  }

  private setMultiCases(cases: { x: number; y: number; char: string }[]) {
    this.list.push(cases);
  }

  setCases(left: number, top: number, pattern: string): void {
    const char = pattern.split("")[0];
    this.list.push({ x: left, y: top, char });
  }

  growAll() {
    const seedX = Math.round(this.width / 2);
    const seedY = 1;
    const trunkId = trunkIdGen.next().value!;
    console.log(`trunk id = ${trunkId}`);
    const queue: Section[][] = [
      [
        {
          id: trunkId,
          thresholdToSplit: 100,
          x: seedX,
          y: seedY,
          type: SectionType.upward,
          element: "trunk",
          toGrow: 0,
          width: 4,
          age: 0,
          time: 0,
          life: 0,
        },
      ],
    ];

    while (queue.length) {
      console.group("generation", generationIdGen.next().value);
      const sections = queue.shift()!;
      const cases = sections.flatMap(this.casesToDisplay, this);
      console.log("sections", ...sections);
      console.log("cases", ...cases);
      this.list.push(cases);

      const nextSections = sections
        .flatMap((section) => this.growSection(section, Math.random()))
        .filter<Section>((s) => typeof s !== "undefined");
      console.log(
        "sections",
        ...sections,
        "produced next sections",
        ...nextSections
      );

      if (nextSections.length) queue.push(nextSections);
      console.groupEnd();
    }
  }

  casesToDisplay(section: Section): Case[] {
    const { element, x, y } = section;
    switch (element) {
      case TRUNK: {
        return this.casesForTrunk(section);
      }
      case LEAF:
        return [{ x, y, char: "&" }];
      case BRANCH:
        const { type } = section;
        const char =
          type === SectionType.upLeft
            ? "\\"
            : type === SectionType.upRight
            ? "/"
            : type === SectionType.left
            ? "_"
            : "_";
        return [
          {
            x,
            y,
            char: section.branchChar ? section.branchChar : char,
          },
        ];
    }
  }

  casesForTrunk(section: TrunkSection): Case[] {
    if (section.age === 0) {
      const char = `/${" ".repeat(section.width)}\\`;
      return char
        .split("")
        .map((ch, index) => ({ x: section.x + index, y: section.y, char: ch }));
    }

    let char: string;
    switch (section.type) {
      case SectionType.upLeft:
        char = `\\${" ".repeat(section.width)}\\`;
        break;

      case SectionType.upward:
        char = `/${" ".repeat(section.width)}\\`;
        break;

      case SectionType.upRight:
        char = `/${" ".repeat(section.width)}/`;
        break;

      default:
        char = `|${" ".repeat(section.width)}|`;
    }

    return char
      .split("")
      .map((ch, index) => ({ x: section.x + index, y: section.y, char: ch }));
  }

  growSection(
    section: Section,
    random: number
  ): [Section] | [Section, Section] | undefined {
    const age = section.age;
    const element = section.element;
    if (age >= 28) return undefined;

    switch (element) {
      case TRUNK:
        return this.processTrunk(section);
      case BRANCH:
        return this.processBranch(section);
      case LEAF:
        return this.processLeaf(section);
      default:
        return undefined;
    }
  }

  step(i: number): (typeof this.list)[number] | undefined {
    if (i < 0 || i > this.list.length) return;
    return this.list[i];
  }

  frame(time: number): (typeof this.list)[number] | undefined {
    return undefined;
  }

  processBranch(
    section: BranchSection
  ): [Section] | [Section, Section] | undefined {
    const toGrow = section.toGrow;
    const sectionDies = toGrow <= 1;
    if (sectionDies) {
      return this.tryNewBranchSection(section);
    }
    let x = section.x;
    let y = section.y;
    switch (section.type) {
      case SectionType.upward:
        y++;
        break;
      case SectionType.upLeft:
        y++;
        x--;
        break;
      case SectionType.upRight:
        x++;
        y++;
        break;
      case SectionType.right:
        x++;
        break;
      case SectionType.left:
        x--;
        break;
      default:
        console.log("unknown type", section.type);
    }

    return [
      { ...section, x, y, age: section.age + 1, toGrow: section.toGrow - 1 },
    ];
  }

  continueSection(
    section: BranchSection,
    newTarget: Target
  ): BranchSection | undefined {
    const { x, y, type: previousType } = section;
    const { x: tX, y: tY } = newTarget;
    const dX = Math.abs(x - tX);
    const dY = Math.abs(y - tY);

    const shouldGrowDiagonally = y < tY;
    const targetIsToTheRight = x < tX;

    // can only grow in expanding direction?? no

    let newType: SectionType;
    let toGrow = 3;
    if (shouldGrowDiagonally) {
      newType = targetIsToTheRight ? SectionType.upRight : SectionType.upLeft;
      toGrow = Math.max(0, Math.min(toGrow, dY));
      console.log("grow diag", toGrow);
    } else {
      newType = targetIsToTheRight ? SectionType.right : SectionType.left;
      toGrow = Math.max(0, Math.min(toGrow, dX));
      console.log("grow horizon", toGrow);
    }

    if (toGrow === 0) {
      console.log("cannot grow");
      return undefined;
    }

    let newX = x;
    let newY = y;
    switch (newType) {
      case SectionType.left:
      case SectionType.upLeft:
        newX--;
        newY += previousType === SectionType.upLeft ? 1 : 0;
        break;
      case SectionType.right:
      case SectionType.upRight:
        newX++;
        newY += previousType === SectionType.upRight ? 1 : 0;
        break;
    }

    return this.initBranch(
      { ...section, target: newTarget },
      { type: newType, toGrow, x: newX, y: newY }
    );
  }

  tryNewBranchSection(
    section: BranchSection
  ): [BranchSection] | [BranchSection, BranchSection] | undefined {
    const {
      x,
      y,
      target: { x: tX, y: tY },
      generation,
    } = section;

    if (generation > 21) {
      return undefined;
    }

    const manhattanDist = Math.abs(x - tX) + Math.abs(y - tY);
    console.log("manhattan", manhattanDist, { x, y }, { tX, tY });

    if (manhattanDist == 4) {
      console.log("split branch");
      const continued = this.continueSection(section, section.target);
      const splitBranch = this.continueSection(
        section,
        this.generateTarget(section)
      );
      if (continued && splitBranch) {
        return [continued, splitBranch];
      } else if (continued) {
        return [continued];
      } else if (splitBranch) {
        return [splitBranch];
      } else {
        return undefined;
      }
    }

    const continued = this.continueSection(section, section.target);
    return continued ? [continued] : undefined;
  }

  generateTarget(section: BranchSection): Target {
    const {
      type,
      target: { x, y },
    } = section;
    const newY = y + 1;
    const newX = type === SectionType.left ? x - 2 : x + 2;
    return { x: newX, y: newY };
  }

  processLeaf(section: Section): [Section] | [Section, Section] | undefined {
    return undefined;
  }

  processTrunk(
    section: TrunkSection
  ): [Section] | [Section, Section] | undefined {
    const toGrow = section.toGrow;
    const sectionDies = toGrow <= 1;
    if (sectionDies) {
      return this.tryNewTrunkSection(section);
    }

    let x = section.x;
    let y = section.y;
    switch (section.type) {
      case SectionType.upward:
        y++;
        break;
      case SectionType.upLeft:
        y++;
        x--;
        break;
      case SectionType.upRight:
        x++;
        y++;
        break;
    }

    return [{ ...section, x, y, age: section.age + 1, toGrow: toGrow - 1 }];
  }

  initBranch(
    init: { age: number; target: Target; id: number; generation: number },
    override: Partial<Omit<BranchSection, "age" | "target">>
  ): BranchSection {
    const { age, target, id, generation } = init;
    const newId = branchIdGen.next().value!;
    console.log(
      `branch ${id} produced branch ${newId} with target ${JSON.stringify(
        target
      )}`
    );
    return {
      id: newId,
      age: age + 1,
      target,
      element: BRANCH,
      thresholdToSplit: 40,
      toGrow: 3,
      type: SectionType.left,
      width: 1,
      time: 0,
      generation: generation + 1,
      x: 0,
      y: 0,
      life: 0,
      ...override,
    };
  }

  initLeaf(override: Partial<LeafSection>): LeafSection {
    return {
      id: 0,
      life: 0,
      age: 0,
      element: "leaf",
      thresholdToSplit: 40,
      toGrow: 3,
      width: 1,
      time: 0,
      x: 0,
      y: 0,
      ...override,
    };
  }

  tryNewTrunkSection(
    section: TrunkSection
  ): [Section] | [Section, Section] | undefined {
    const x = section.x;
    const y = section.y;
    const width = section.width;
    const cannotCreateTrunkSection = section.width <= 0;
    if (cannotCreateTrunkSection) {
      // TODO choose target in a random point in the proximity - do not go back
      const b1 = this.continueSection(
        {
          ...section,
          target: { x: 0, y: 0 },
          generation: 0,
          element: "branch",
        },
        { x: x - 10, y: y + 2 }
      );
      const b2 = this.continueSection(
        {
          ...section,
          target: { x: 0, y: 0 },
          generation: 0,
          element: "branch",
        },
        { x: x + 10, y: y + 2 }
      );
      if (b1 && b2) return [b1, b2];
      if (b1) return [b1];
      if (b2) return [b2];
      return undefined;
    }
    const newAge = section.age + 1;
    const newWidth = Math.max(0, width - 1);
    const baseSection = {
      id: trunkIdGen.next().value!,
      age: newAge,
      width: newWidth,
      element: section.element,
      thresholdToSplit: section.thresholdToSplit - 10,
      time: 0,
      life: 0,
    } as const;
    switch (section.type) {
      case SectionType.upward: {
        const newType =
          section.age < 2 ? SectionType.upLeft : SectionType.upRight;
        const newX = newType === SectionType.upLeft ? x : x + 1;
        const splitGrow = newType === SectionType.upLeft ? 2 : 2;
        return [
          {
            ...baseSection,
            x: newX,
            y: y + 1,
            toGrow: splitGrow,
            type: newType,
          },
        ];
      }
      case SectionType.upRight: {
        return [
          {
            ...baseSection,
            x: x + 1,
            y: y + 1,
            toGrow: 3,
            type: SectionType.upRight,
          },
        ];
      }
      case SectionType.upLeft: {
        return [
          { ...baseSection, x, y: y + 1, toGrow: 0, type: SectionType.upward },
        ];
      }
    }
  }
}
