import { Component, OnInit } from '@angular/core';
import { StandardMap } from '../standard-map';
import { StandardMapService } from '../standard-map.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [ './dashboard.component.css' ]
})
export class DashboardComponent implements OnInit {
  standardMaps: StandardMap[] = [];

  constructor(private standardMapService: StandardMapService) { }

  ngOnInit() {
    this.getStandardMaps();
  }

  getStandardMaps(): void {
    this.standardMapService.getStandardMaps()
      .subscribe(standardMaps => this.standardMaps = standardMaps.slice(1, 5));
  }
}
