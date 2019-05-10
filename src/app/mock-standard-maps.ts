import { StandardMap } from './standard-map';
import * as mockMapDb from './data/msftgdprsample.json'

export var mapDb: any = mockMapDb.default;


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
