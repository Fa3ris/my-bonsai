const SectionType = {
  upward: 0,
  upLeft: 1,
  upRight: 2,
  left: 3,
  right: 4,
} as const;
type SectionType = (typeof SectionType)[keyof typeof SectionType];
type Leaf = { x: number; y: number };

type TreeElement = "trunk" | "branck" | "leaf";

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

type Section = {
  type: SectionType;
  element: TreeElement;
  x: number;
  y: number;
  age: number;
  thresholdToSplit: number;
  toGrow: number;
  width: number;
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
      case "trunk": {
        if (section.age === 0) {
          const pattern = `/${" ".repeat(section.width)}\\`;
          return [{ x: section.x, y: section.y, char: pattern }];
        }

        let pattern: string;

        switch (section.type) {
          case SectionType.upLeft:
            pattern = `\\${" ".repeat(section.width)}\\`;
            break;

          case SectionType.upward:
            pattern = `/${" ".repeat(section.width)}\\`;
            break;

          case SectionType.upRight:
            pattern = `/${" ".repeat(section.width)}/`;
            break;

          default:
            pattern = `|${" ".repeat(section.width)}|`;
        }

        return [{ x: section.x, y: section.y, char: pattern }];
      }
    }
    return [{ x: section.x, y: section.y, char: "/" }];
  }

  growSection(
    section: Section,
    random: number
  ): [Section] | [Section, Section] | undefined {
    let x = section.x;
    let y = section.y;
    const width = section.width;
    const age = section.age;
    const type = section.type;
    const toGrow = section.toGrow;
    const element = section.element;
    const newAge = age + 1;
    const newWidth = Math.max(0, width - 1);
    const sectionDies = toGrow <= 1;
    if (age >= 9) return undefined;
    if (element !== "trunk") return undefined;

    if (type === SectionType.upward) {
      if (toGrow === 0) {
        const newType = age < 2 ? SectionType.upLeft : SectionType.upRight;
        const newX = newType === SectionType.upLeft ? x : x + 1;
        const splitGrow = newType === SectionType.upLeft ? 2 : 2;
        return [
          {
            age: newAge,
            x: newX,
            y: y + 1,
            element,
            thresholdToSplit: section.thresholdToSplit - 10,
            toGrow: splitGrow,
            type: newType,
            width: newWidth,
          },
        ];
      }
    } else if (type === SectionType.upLeft) {
      if (sectionDies)
        return [
          {
            age: newAge,
            x,
            y: y + 1,
            element,
            thresholdToSplit: section.thresholdToSplit - 10,
            toGrow: 0,
            type: SectionType.upward,
            width: newWidth,
          },
        ];
    } else if (type === SectionType.upRight) {
      if (sectionDies) {
        if (width <= 0) return undefined;
        return [
          {
            age: newAge,
            x: x + 1,
            y: y + 1,
            element,
            thresholdToSplit: section.thresholdToSplit - 10,
            toGrow: 3,
            type: SectionType.upRight,
            width: newWidth,
          },
        ];
      }
    }

    const newToGrow = toGrow - 1;
    if (newToGrow <= 0) return undefined;

    // next direction
    switch (section.type) {
      case SectionType.upward:
        y++;
        break;
      case SectionType.upLeft: {
        y++;
        x--;
        break;
      }
      case SectionType.upRight: {
        x++;
        y++;
      }
    }

    return [{ ...section, x, y, age: newAge, width, type, toGrow: newToGrow }];
  }

  step(i: number): (typeof this.list)[number] | undefined {
    if (i < 0 || i > this.list.length) return;
    return this.list[i];
  }
}
