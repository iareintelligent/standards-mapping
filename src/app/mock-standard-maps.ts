﻿import { StandardMap } from './standard-map';

export var mapDb: any = {
	"document_nodes": [{
		"id": "5_2_3_a",
		"type": "ISO",
		"section": "5.2.3 a)",
		"body": "The orgnization shall.....",
		"country": "", 
		"region": "",
		"compliance_level": 1,
		"external_doc_node_references": [{ 
			"type": "APP",
			"id": "1_2",
			"rev": "1",
		}, {
			"type": "PIPEDA",
			"id": "4_1",
			"rev": "1",
		}, , {
			"type": "PDPD",
			"id": "S_4",
			"rev": "1",
		}, , {
			"type": "PDPA",
			"id": "s_11",
			"rev": "1",
		}],
		"parent_node_references": [
			{
				"rev": "1",
				"id": "5"
			}
		],
		"internal_doc_node_references": [
			{
				"rev": "1",
				"id": "5_2"
			}
		],
		"rev": "1",
		"foot_notes": [{
			"number": 10,
			"rev": "1"
		}, {
			"number": 11,
			"rev": "1"
		}]
	}, {

		"id": "1_2",
		"type": "APP",
		"section": "APP 1.2",
		"body": "Must take responsiblity.....",
		"country": "Australia",
		"compliance_level": 2,
		"external_doc_node_references": [{ 
			"type": "ISO",
			"id": "5_2_3_a",
			"rev": "1", 
		}],
		"parent_node_references": [ 
			{
				"rev": "1",
				"id": "1_2"
			}
		],
		"internal_doc_node_references": [],
		"rev": "1"
	}, {

		"id": "4_1",
		"type": "PIPEDA",
		"section": "4.1",
		"body": "Responsible for personal information under.....",
		"country": "Canada", 
		"compliance_level": 1,
		"external_doc_node_references": [{
			"type": "ISO",
			"id": "5_2_3_a",
			"rev": "1",
		}],
		"parent_node_references": [{
			"rev": "4",
			"id": "1_2"
		}],
		"internal_doc_node_references": [],
		"rev": "1"
	},{

		"id": "a_12_3",
		"type": "LPPD",
		"section": "A.12.3",
		"body": "Must conduct necessary inspections in order to ensure compliance",
		"country": "Turkey",
		"compliance_level": 1,
		"external_doc_node_references": [{
			"type": "ISO",
			"id": "5_2_3_a",
			"rev": "1",
		}, {
			"type": "ISO",
			"id": "5_2_4",
			"rev": "1",
		}],
		"parent_node_references": [
			{
				"rev": "1",
				"id": "A_12"
			}
		],
		"internal_doc_node_references": [],
		"rev": "1"
	},{

		"id": "5_2_4",
		"type": "ISO",
		"section": "5.2.4",
		"body": "The organization shall establish, implement,....",
		"country": "Turkey",
		"compliance_level": 1,
		"external_doc_node_references": [{ 
			"type": "LDDP",
			"id": "a_12_3",
			"rev": "1",
		}],
		"parent_node_references": [ 
			{
				"rev": "1",
				"id": "A_12"
			}
		],
		"internal_doc_node_references": [],
		"rev": "1"
	}, {

		"id": "5",
		"type": "ISO",
		"section": "5",
		"body": "Specific requirements related to ISO/IEC 27001",
		"external_doc_node_references": [],
		"parent_node_references": [],
		"internal_doc_node_references": [],
		"rev": "1"
	}, {

		"id": "6",
		"type": "ISO",
		"section": "6",
		"body": "Specific guidance related to ISO/IEC 27002",
		"external_doc_node_references": [],
		"parent_node_references": [],
		"internal_doc_node_references": [],
		"rev": "1"
	}, {

		"id": "7",
		"type": "ISO",
		"section": "7",
		"body": "Guidance for PII controllers",
		"external_doc_node_references": [],
		"parent_node_references": [],
		"internal_doc_node_references": [],
		"rev": "1",
		"foot_notes": [{
			"number": 7,
			"rev": "1"
		}, {
			"number": 8,
			"rev": "1"
		}, {
			"number": 10,
			"rev": "1"
		}, {
			"number": 14,
			"rev": "1"
		}]
	}, {

		"id": "8",
		"type": "ISO",
		"section": "8",
		"body": "Guidance for PII Processors",
		"external_doc_node_references": [],
		"parent_node_references": [],
		"internal_doc_node_references": [],
		"rev": "1",
		"foot_notes": [{
			"number": 7,
			"rev": "1"
		}, {
			"number": 8,
			"rev": "1"
		}, {
			"number": 10,
			"rev": "1"
		}, {
			"number": 14,
			"rev": "1"
		}]
	}],
	"countries": [{ 
		"country": "Australia",
		"foot_notes": [{
			"number": 1,
			"rev": "1"
		}]
	}, {
		"country": "USA",
		"region": "California", 
		"foot_notes": [{
			"number": 13,
			"rev": "1"
		}, {
			"number": 11,
			"rev": "1"
		}]
	}, {
		"country": "Canada",
		"foot_notes": [{
			"number": 2,
			"rev": "1"
		}]
	}, {
		"country": "Hong Kong",
		"foot_notes": [{
			"number": 3,
			"rev": "1"
		}]
	}, {
		"country": "Singapore",
		"foot_notes": [{
			"number": 4,
			"rev": "1"
		}]
	}, {
		"country": "South Korea",
		"foot_notes": [{
			"number": 5,
			"rev": "1"
		}]
	}, {
		"country": "Turkey",
		"foot_notes": [{
			"number": 6,
			"rev": "1"
		}]
	}, {
		"country": "Brazil",
		"foot_notes": [{
			"number": 17,
			"rev": "1"
		}]
	}],
	"compliance_levels": [{
		"level": 1,
		"body": "meets"
	}, {
		"level": 2,
		"body": "partialy meets"
	}, {
		"level": 3,
		"body": "does not meet"
	}],
	"document_types": [{
		"id": "ISO",
		"title": "ISO 27552 country mapping"
	}, {
		"id": "APP",
		"title": "Australia Privacy Act 1988",
		"country": "Australia"
	}, {
		"id": "PIPEDA",
		"title": " Canada: Personal Information Protection and Electronics Document Act",
		"country": "Canada"
	}, {
		"id": "PDPD",
		"title": "Hong Kong Personal Data Ordinance",
		"country": "Hong Kong"
	}, {
		"id": "DPP",
		"title": "Hong Kong Data Protection Principles",
		"country": "Hong Kong"
	}, {
		"id": "PDPA",
		"title": "Singapore: Personal Data Project Act",
		"country": "Singapore"

	}, {
		"id": "PIPA",
		"title": "South Korea Personal Information Protection Act",
		"country": "South Korea"
	}, {
		"id": "LPPD",
		"title": "Turkey Data Protection Law",
		"country": "Turkey"

	}, {
		"id": "CCPA",
		"title": "USA: California Consumer Privacy Act of 2018",
		"country": "USA",
		"region": "California"
	}, {
		"id": "LGPD",
		"title": "Brazil General Data Protection Law",
		"country": "Brazil"
	}],
	"foot_notes": [{
		"number": 10,
		"body": "something to note here",
		"rev": "1"
	}, {
		"number": 11,
		"body": "something to note here",
		"rev": "1"
	}]
};


export var STANDARDMAPS: StandardMap[] = [
  { 
    id: 11, 
    name: 'GDPR', 
    sections: [
      { 
        id: 1324, 
        title: 'gdpr 1.1.a', 
        links: [
          { doc: 12, section: 41234 }
        ]
      },
      { 
        id: 431243, 
        title: 'gdpr 1.2.a', 
        links: [
          { doc: 12, section: 143 }
        ]
      },
      { 
        id: 654, 
        title: 'gdpr 1.2.b', 
        links: [
          { doc: 12, section: 143 },
          { doc: 12, section: 41234 }
        ]
      }
    ] 
  },
  { 
    id: 12, 
    name: 'Standard', 
    sections: [
      { id: 41234, title: 'std 1.1.a' },
      { id: 143, title: 'std 1.2.a' }
    ] 
  },
  { 
    id: 13, 
    name: 'Australia', 
    sections: [
      { 
        id: 12343, 
        title: 'aus 1.1.a', 
        links: [
          { doc: 12, section: 41234 }
        ]
      },
      { 
        id: 16343, 
        title: 'aus 1.2.a', 
        links: [
          { doc: 12, section: 143 }
        ]
      }
    ] 
  },
];
