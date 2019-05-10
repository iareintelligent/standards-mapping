
export class Link {
  id: string;
  type: string;
  rev: string;
}

export class DocNode {
  id: string;
  type: string;
  rev: string;
  section: string;
  body: string;
  compliance_level: number;
  external_doc_node_references: Link[];
}

export class DocType {
  id: string;
  title: string;
}

export class StandardMap {
  document_nodes: DocNode[];
  document_types?: DocType[];
}

