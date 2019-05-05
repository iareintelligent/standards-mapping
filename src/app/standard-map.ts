
export class Link {
  doc: number;
  section: number;
}

export class Section {
  id: number;
  title: string;
  links?: Link[];
}

export class StandardMap {
  id: number;
  name: string;
  sections: Section[];
}

