import { Component, OnInit } from '@angular/core';
import { StandardMap } from '../standard-map';
import { GraphService } from '../graph.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [ './dashboard.component.css' ]
})
export class DashboardComponent implements OnInit {
  standardMaps: StandardMap[] = [];

  constructor() { }

  ngOnInit() {
    this.getStandardMaps();
  }

  getStandardMaps(): void {
    //this.standardMapService.getStandardMaps()
    //  .subscribe(standardMaps => this.standardMaps = standardMaps);
  }
}
