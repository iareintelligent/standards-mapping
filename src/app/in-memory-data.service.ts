import { InMemoryDbService } from 'angular-in-memory-web-api';
import { StandardMap } from './standard-map';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const standardMaps = [
      { id: 11, name: 'Mr. Nice' },
      { id: 12, name: 'Narco' },
      { id: 13, name: 'Bombasto' },
      { id: 14, name: 'Celeritas' },
      { id: 15, name: 'Magneta' },
      { id: 16, name: 'RubberMan' },
      { id: 17, name: 'Dynama' },
      { id: 18, name: 'Dr IQ' },
      { id: 19, name: 'Magma' },
      { id: 20, name: 'Tornado' }
    ];
    return {'standard-map':standardMaps};
  }

  // Overrides the genId method to ensure that a standard-map always has an id.
  // If the standardMaps array is empty,
  // the method below returns the initial number (11).
  // if the standardMaps array is not empty, the method below returns the highest
  // standard-map id + 1.
  genId(standardMaps: StandardMap[]): number {
    return standardMaps.length > 0 ? Math.max(...standardMaps.map(standardMap => standardMap.id)) + 1 : 11;
  }
}
