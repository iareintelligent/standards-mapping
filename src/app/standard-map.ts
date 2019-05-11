
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

export class FullDocNode {

  public constructor(
    public node: DocNode,
    public children: FullDocNode[] = []) {
  }

  get name():string {
    return this.node.section ? this.node.section : this.node.type;
  }
}

