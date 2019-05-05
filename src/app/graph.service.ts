import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { StandardMap } from './standard-map';
import { StandardMapService } from './standard-map.service';
import { MessageService } from './message.service';
import * as d3Sankey from 'd3-sankey';

export interface SNodeExtra {
    nodeId: number;
    name: string;
}

export interface SLinkExtra {
    source: number;
    target: number;
    value: number;
    uom: string;
}
export type SNode = d3Sankey.SankeyNode<SNodeExtra, SLinkExtra>;
export type SLink = d3Sankey.SankeyLink<SNodeExtra, SLinkExtra>;

export interface DAG {
    nodes: SNode[];
    links: SLink[];
}

function flatten(array) {
    return array.reduce((a,b)=>a.concat(b), []);
}

@Injectable({ providedIn: 'root' })
export class GraphService {

  constructor(
    private standardMapService: StandardMapService,
    private messageService: MessageService) { }

  getGraphData(docA: number, docB: number, docC: number): Observable<DAG> {
    var a = this.standardMapService.getStandardMap(docA);
    var b = this.standardMapService.getStandardMap(docB);
    var c = this.standardMapService.getStandardMap(docC);

    return forkJoin(a, b, c)
        .pipe(
          map(ab => {
                  var sections = ab[0].sections.concat(ab[1].sections).concat(ab[2].sections);
                  var nodes = sections.map((v,i,x)=>{ return {nodeId:v.id, name:v.title}; });
                  
                  var allLinks = flatten(sections.map(s=>{ return s.links ? s.links.map(l=>{return [s,l];}) : []; }));
                  var links = allLinks.map(sl=>{ return {source:sl[0].id, target:sl[1].section, value:1}; });
                  return { nodes: nodes, links: links };
            }),
          catchError(this.handleError<DAG>('getGraphData', null))
        );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /** Log a StandardMapService message with the MessageService */
  private log(message: string) {
    this.messageService.add(`StandardMapService: ${message}`);
  }
}
