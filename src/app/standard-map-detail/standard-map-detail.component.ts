import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { StandardMap }         from '../standard-map';
import { GraphService }  from '../graph.service';

@Component({
  selector: 'app-standard-map-detail',
  templateUrl: './standard-map-detail.component.html',
  styleUrls: [ './standard-map-detail.component.css' ]
})
export class StandardMapDetailComponent implements OnInit {
  @Input() standardMap: StandardMap;

  constructor(
    private route: ActivatedRoute,
    private graphService: GraphService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.getStandardMap();
  }

  getStandardMap(): void {
    //this.route.params.subscribe(params => {
    //   this.graphService.getDocByType(params['id'])
    //    .subscribe(standardMap => this.standardMap = standardMap);
    //});
  }

  goBack(): void {
    this.location.back();
  }

 //save(): void {
 //   this.standardMapService.updateStandardMap(this.standardMap)
 //     .subscribe(() => this.goBack());
 // }
}
