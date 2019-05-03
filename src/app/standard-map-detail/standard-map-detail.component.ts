import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { StandardMap }         from '../standard-map';
import { StandardMapService }  from '../standard-map.service';

@Component({
  selector: 'app-standard-map-detail',
  templateUrl: './standard-map-detail.component.html',
  styleUrls: [ './standard-map-detail.component.css' ]
})
export class StandardMapDetailComponent implements OnInit {
  @Input() standardMap: StandardMap;

  constructor(
    private route: ActivatedRoute,
    private standardMapService: StandardMapService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.getStandardMap();
  }

  getStandardMap(): void {
    const id = +this.route.snapshot.paramMap.get('id');
    this.standardMapService.getStandardMap(id)
      .subscribe(standardMap => this.standardMap = standardMap);
  }

  goBack(): void {
    this.location.back();
  }

 save(): void {
    this.standardMapService.updateStandardMap(this.standardMap)
      .subscribe(() => this.goBack());
  }
}
