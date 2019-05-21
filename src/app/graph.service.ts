import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { StandardMap, FullDocNode, DocNode, DocNode2, Doc2 } from './standard-map';
import { MessageService } from './message.service';
import * as d3Sankey from 'd3-sankey';
import { TreeModel, TreeNode, ITreeState } from 'angular-tree-component';

import { mapDb } from './mock-standard-maps';


export interface ICategory {
    id: string;
    title: string;
    active?: boolean;
}

export type CategoryList = ICategory[]; 

export class FilterCriteria {
    constructor(
        public categoryIds: string[] = null,
        public categoryOrder: string[] = null) {
        
        }
}


// -- Dag Node --
export interface SNodeExtra {
    nodeId: number;
    name: string;
    data?: any;
}

export interface SLinkExtra {
    source: number;
    target: number;
    value: number;
    uom: string;
    sourceNode: any;
    targetNode: any;
}

export type SNode = d3Sankey.SankeyNode<SNodeExtra, SLinkExtra>;
export type SLink = d3Sankey.SankeyLink<SNodeExtra, SLinkExtra>;

export interface DAG {
    nodes: SNode[];
    links: SLink[];
}
// -- Dag Node --

export class GraphTab {
    public options = {
      useCheckbox: true
    };

    public state: ITreeState = { };
    public treeModel: TreeModel;
    public visibleNodes: TreeNode[] = [];
    public displayLinks: any[] = [];

    public nodes = [
      {
        name: 'North America',
        children: [
          { name: 'United States', children: [
            {name: 'New York'},
            {name: 'California'},
            {name: 'Florida'}
          ] },
          { name: 'Canada' }
        ]
      },
      {
        name: 'South America',
        children: [
          { name: 'Argentina', children: [] },
          { name: 'Brazil' }
        ]
      },
      {
        name: 'Europe',
        children: [
          { name: 'England' },
          { name: 'Germany' },
          { name: 'France' },
          { name: 'Italy' },
          { name: 'Spain' }
        ]
      }
    ];

    public column: GraphTab;

    constructor(
      public title: string,
      public active: boolean = false,
      public isParent: boolean = false) {
        if (isParent)
        {
          this.column = new GraphTab(title);
          this.column.options.useCheckbox = false;
        }
    }
}

@Injectable({ providedIn: 'root' })
export class GraphService {
  private docGuids = {};
  private nextDocGuid = 0;

  constructor(
    private messageService: MessageService) { }

  //getGraphData(docA: number, docB: number, docC: number): Observable<DAG> {
  //  var a = this.standardMapService.getStandardMap(docA);
  //  var b = this.standardMapService.getStandardMap(docB);
  //  var c = this.standardMapService.getStandardMap(docC);
  //
  //  return forkJoin(a, b, c)
  //      .pipe(
  //        map(ab => {
  //                var sections = ab[0].sections.concat(ab[1].sections).concat(ab[2].sections);
  //                var nodes = sections.map((v,i,x)=>{ return {nodeId:v.id, name:v.title}; });
  //                
  //                var allLinks = flatten(sections.map(s=>{ return s.links ? s.links.map(l=>{return [s,l];}) : []; }));
  //                var links = allLinks.map(sl=>{ return {source:sl[0].id, target:sl[1].section, value:1}; });
  //                return { nodes: nodes, links: links };
  //          }),
  //        catchError(this.handleError<DAG>('getGraphData', null))
  //      );
  //}

  flatten(array) {
      return array.reduce((a,b)=>a.concat(b));
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
      //var nodes = mapDb2.document_nodes;
      //var mappedNodes = nodes.map(v => { return { nodeId: this.getGuid(v.id, v.type, v.rev), name: v.section, data: v, connections: 0}; });
      //
      //var nodeMap = mappedNodes.reduce((m, o) => {
      //    m[o.nodeId] = o;
      //    return m;
      //}, {});
      //
      //var limitedNodes = mappedNodes.filter(v => filter.categoryIds == null || filter.categoryIds.includes(v.data.type));
      //
      //var allLinks = flatten(limitedNodes.map(n => { return n.data.external_doc_node_references ? n.data.external_doc_node_references.map(l => { return [n, l]; }) : []; }));
      //var mappedLinks = allLinks.map(nl => { 
      //  var n = nl[0]; 
      //  var t = nl[1];
      //  var targetId = this.getGuid(t.id, t.type, t.rev, false);
      //  if (!targetId)
      //    return null;
      //
      //  var targetNode = nodeMap[targetId];
      //  targetNode.connections++;
      //  n.connections++;
      //  
      //  var sourceNode = n;
      //
      // if (filter && filter.categoryOrder && filter.categoryOrder.indexOf(targetNode.data.type) < filter.categoryOrder.indexOf(n.data.type))
      // {
      //     sourceNode = targetNode;
      //     targetNode = n; 
      // }
      //
      //  var result = { 
      //      source: sourceNode.nodeId, 
      //      target: targetNode.nodeId,
      //      sourceNode: sourceNode, 
      //      targetNode: targetNode,
      //      value: n.data.compliance_level
      //   };
      //
      //   return result;
      // });
      //
      //var filteredLinks = mappedLinks.filter(v => v);
      //var filteredNodes = mappedNodes.filter(v => v.connections > 0 || (filter.categoryIds && filter.categoryIds.includes(v.data.type)));

      var filteredLinks = [];
      var filteredNodes = [];

      var result = { nodes: filteredNodes, links: filteredLinks };
      return of(result);
  }

  getDocTypes() : Observable<CategoryList> {
      var result = mapDb.map(v => { return { id: v.type, title: v.type }; });
      return of(result);
  }

  private addToDoc(parent: FullDocNode, input: DocNode2) {
      var child = new FullDocNode(input);

      if (parent)
      {
        parent.children.push(child);
      }

      // Recurse
      for (var c of input.children)
      {
        this.addToDoc(child, c);
      }

      return child;
  }

  getFullDocByType(docType: string) : Observable<FullDocNode> {
      //var dump = JSON.stringify(mapDb2, null, 4);
      var doc = mapDb.find(n => n.type == docType);
      var result = this.addToDoc(null, doc);
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

  /** Log a GraphService message with the MessageService */
  private log(message: string) {
    this.messageService.add(`GraphService: ${message}`);
  }
}
