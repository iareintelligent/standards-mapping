
export class Link {
  id: string;
  type: string;
  ref: string;
}

export class DocNode {
  id: string;
  type: string;
  ref: string;
  section: string;
  body: string;
  compliance_level: number;
  external_doc_node_references: Link[];
}

export class StandardMap {
  document_nodes: DocNode[];
}

