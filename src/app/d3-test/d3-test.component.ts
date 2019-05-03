import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { Hero }         from '../hero';
import { HeroService }  from '../hero.service';
import { D3Service, D3, Selection } from 'd3-ng2-service'; 

@Component({
  selector: 'app-d3-test',
  templateUrl: './d3-test.component.html',
  styleUrls: [ './d3-test.component.css' ]
})
export class D3TestComponent implements OnInit {

  private d3: D3; // <-- Define the private member which will hold the d3 reference
  private parentNativeElement: any;
 
  constructor(element: ElementRef, d3Service: D3Service) { // <-- pass the D3 Service into the constructor
    this.d3 = d3Service.getD3(); // <-- obtain the d3 object from the D3 Service
    this.parentNativeElement = element.nativeElement;
  }
 
  ngOnInit() {
    let d3 = this.d3; // <-- for convenience use a block scope variable
    let d3ParentElement: Selection<any, any, any, any>; // <-- Use the Selection interface (very basic here for illustration only)
 
// ...
 
    if (this.parentNativeElement !== null) {
 
      d3ParentElement = d3.select(this.parentNativeElement); // <-- use the D3 select method 
 
      // Do more D3 things 
 
    }
  }
 
}
