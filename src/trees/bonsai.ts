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

type BaseSection = {
  x: number;
  y: number;
  age: number;
  thresholdToSplit: number;
  toGrow: number;
  width: number;
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

type BranchSection = BaseSection & {
  type: SectionType;
  element: typeof BRANCH;
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

    const queue: Section[][] = [
      [
        {
          thresholdToSplit: 100,
          x: seedX,
          y: seedY,
          type: SectionType.upward,
          element: "trunk",
          toGrow: 0,
          width: 4,
          age: 0,
        },
      ],
    ];

    while (queue.length) {
      const sections = queue.shift()!;

      const newGeneration = sections.map((section) => ({
        cases: this.casesToDisplay(section),
        sections: this.growSection(section, Math.random()),
      }));

      this.list.push(newGeneration.flatMap((generation) => generation.cases));

      const nextSections = newGeneration
        .flatMap((generation) => generation.sections)
        .filter<Section>((s) => typeof s !== "undefined");
      console.log("next sections", nextSections);
      if (nextSections.length) queue.push(nextSections);
    }
  }

  casesToDisplay(section: Section): Case[] {
    switch (section.element) {
      case TRUNK: {
        return this.casesForTrunk(section);
      }
      case LEAF:
        return [{ x: section.x, y: section.y, char: "&" }];
      case BRANCH:
        return [{ x: section.x, y: section.y, char: "*" }];
    }
  }

  casesForTrunk(section: TrunkSection): Case[] {
    if (section.age === 0) {
      const char = `/${" ".repeat(section.width)}\\`;
      return [{ x: section.x, y: section.y, char }];
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

    return [{ x: section.x, y: section.y, char }];
  }

  growSection(
    section: Section,
    random: number
  ): [Section] | [Section, Section] | undefined {
    const age = section.age;
    const element = section.element;
    // if (age >= 9) return undefined;
    // if (element !== "trunk") return undefined;

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
  processBranch(section: Section): [Section] | [Section, Section] | undefined {
    return undefined;
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

  initBranch(override: Partial<BranchSection>): BranchSection {
    return {
      age: 0,
      element: BRANCH,
      thresholdToSplit: 40,
      toGrow: 3,
      type: SectionType.left,
      width: 1,
      x: 0,
      y: 0,
      ...override,
    };
  }

  initLeaf(override: Partial<LeafSection>): LeafSection {
    return {
      age: 0,
      element: "leaf",
      thresholdToSplit: 40,
      toGrow: 3,
      width: 1,
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
    if (width <= 0)
      return [this.initBranch({ x: x - 1, y }), this.initLeaf({ x: x + 1, y })];
    const element = section.element;
    const newAge = section.age + 1;
    const newWidth = Math.max(0, width - 1);
    const baseSection = {
      age: newAge,
      width: newWidth,
      element,
      thresholdToSplit: section.thresholdToSplit - 10,
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
