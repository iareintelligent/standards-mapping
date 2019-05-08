import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { StandardMap } from './standard-map';
import { StandardMapService } from './standard-map.service';
import { MessageService } from './message.service';
import * as d3Sankey from 'd3-sankey';

import { mapDb } from './mock-standard-maps';


export interface ICategory {
    id: string;
    title: string;
    active?: boolean;
}

export type CategoryList = ICategory[]; 

export class FilterCriteria {
    constructor(
        public categoryIds: string[] = null) {
        
        }
}


// -- Dag Node --
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
// -- Dag Node --

function flatten(array) {
    return array.reduce((a,b)=>a.concat(b));
}

@Injectable({ providedIn: 'root' })
export class GraphService {
  private docGuids = {};
  private nextDocGuid = 0;

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

  getGuid(id: string, type: string, rev: string, createMissing: boolean = true): number {
      var key = `${type}-${id}-${rev}`;
      if (key in this.docGuids)
        return this.docGuids[key];

      if (!createMissing)
        return null;

      var value = this.nextDocGuid++;
      this.docGuids[key] = value;
      return value;
  }

  getGraphData2(filter: FilterCriteria): Observable<DAG> {
      var nodes = mapDb.document_nodes;
      var mappedNodes = nodes.map(v => { return { nodeId: this.getGuid(v.id, v.type, v.rev), name: v.section, data: v, connections: 0}; });
      
      var nodeMap = mappedNodes.reduce((m, o) => {
          m[o.nodeId] = o;
          return m;
      }, {});
      
      var limitedNodes = mappedNodes.filter(v => filter.categoryIds == null || filter.categoryIds.includes(v.data.type));

      var allLinks = flatten(limitedNodes.map(n => { return n.data.external_doc_node_references ? n.data.external_doc_node_references.map(l => { return [n, l]; }) : []; }));
      var mappedLinks = allLinks.map(nl => { 
        var n = nl[0]; 
        var t = nl[1];
        var targetId = this.getGuid(t.id, t.type, t.rev, false);
        if (!targetId)
          return null;

        nodeMap[targetId].connections++;
        n.connections++;

        var result = { 
            source: n.nodeId, 
            target: targetId, 
            value: n.data.compliance_level 
         };
         return result;
       });

      var filteredLinks = mappedLinks.filter(v => v);
      var filteredNodes = mappedNodes.filter(v => v.connections > 0);

      var result = { nodes: filteredNodes, links: filteredLinks };
      return of(result);
  }

  getDocTypes() : Observable<CategoryList> {
      var data = mapDb.document_types;
      var result = data.map(v => { return { id: v.id, title: v.title }; });
      return of(result);
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
