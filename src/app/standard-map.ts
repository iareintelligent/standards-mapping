
export class Link {
  id: string;
  type: string;
  rev: string;
}

export class DocNode {
  id?: string;
  type: string;
  rev?: string;
  section?: string;
  body?: string;
  compliance_level?: number;
  external_doc_node_references?: Link[];
  internal_doc_node_references?: Link[];
}

export class DocType {
  id: string;
  title: string;
}

export class StandardMap {
  document_nodes: DocNode[];
  document_types?: DocType[];
}

export class DocNode2 {
  id?: string;
  section?: string;
  body?: string;
  compliance_level?: number;
  children: DocNode2[];
  links: Link[];
}


export class Doc2 extends DocNode2 {
  type: string;
  rev?: string;
}

export class FullDocNode {

  public constructor(
    public node: Doc2 | DocNode2,
    public children: FullDocNode[] = []) {
  }

  get name():string {
    var name = this.node.section ? this.node.section : (this.node as Doc2).type;
    if (this.node.body)
      name += " - " + this.node.body;
    return name;
  }

  get id(): string {
    return this.node.section;
  }
}