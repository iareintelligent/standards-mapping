import { Component, OnInit } from '@angular/core';

import { StandardMap } from '../standard-map';
import { StandardMapService } from '../standard-map.service';

@Component({
  selector: 'app-standard-maps',
  templateUrl: './standard-maps.component.html',
  styleUrls: ['./standard-maps.component.css']
})
export class StandardMapsComponent implements OnInit {
  standardMaps: StandardMap[];

  constructor(private standardMapService: StandardMapService) { }

  ngOnInit() {
    this.getStandardMaps();
  }

  getStandardMaps(): void {
    this.standardMapService.getStandardMaps()
    .subscribe(standardMaps => this.standardMaps = standardMaps);
  }

  add(name: string): void {
    name = name.trim();
    if (!name) { return; }
    this.standardMapService.addStandardMap({ name } as StandardMap)
      .subscribe(standardMap => {
        this.standardMaps.push(standardMap);
      });
  }

  delete(standardMap: StandardMap): void {
    this.standardMaps = this.standardMaps.filter(h => h !== standardMap);
    this.standardMapService.deleteStandardMap(standardMap).subscribe();
  }

}
