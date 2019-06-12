import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { StandardMap, FullDocNode, DocNode, DocNode2, Doc2, Link } from './standard-map';
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

export class VisibleLink {
    constructor(
         public fromNode: TreeNode,
         public link: Link) {
         
         }
}

export class GraphTab {
    constructor(
      public title: string,
      public isParent: boolean = false) {
        this.isIso = title == "ISO";

        if (isParent)
        {
          this.column = new GraphTab(title);
          this.column.options.useCheckbox = false;
          this.column.filter = (vs, n) => GraphTab.filterBySelectedLeafs(vs, this.treeModel, n);
        }
    }

    public options = {
      useCheckbox: true,
      scrollOnActivate: false,
    };

    public state: ITreeState = { };
    public treeModel: TreeModel;
    public visibleNodes: TreeNode[] = [];
    public visibleLinks: VisibleLink[] = [];
    public displayLinks: any[] = [];
    public filter: (vs: TreeNode[], n: TreeNode)=>boolean; 
    public isIso: boolean = false;
    public searchValue: string = null;
    public coverage: string = " - ";

    public get anyExpanded():boolean {
      return this.treeModel && this.treeModel.expandedNodes.length > 0; 
    }

    public get anySelected():boolean {
      return this.treeModel && this.treeModel.selectedLeafNodeIds && Object.keys(this.treeModel.selectedLeafNodeIds).length > 0; 
    }

    public nodes = [];

    public column: GraphTab;

    public static filterBySelectedLeafs(visibleNodes: TreeNode[], parentTree: TreeModel, node: TreeNode): boolean
    {
        var show = (node.data.id in parentTree.selectedLeafNodeIds) || Object.keys(parentTree.selectedLeafNodeIds).length == 0;
        if (show)
            visibleNodes.push(node);
        return show;
    }

    public static filterByVisibleLeafs(visibleNodes: TreeNode[], parentTree: TreeNode[], node: TreeNode): boolean
    {
        var show = parentTree.find(n => {
            return n.id == node.data.id;
        }) != null;
        if (show)
            visibleNodes.push(node);
        return show;
    }

    public static filterByVisibleLinks(visibleNodes: TreeNode[], parentTree: VisibleLink[], node: TreeNode): boolean
    {
        var show = parentTree.find(n => {
            return n.link.id == node.data.id;
        }) != null;
        if (show)
            visibleNodes.push(node);
        return show;
    }
    
    public runFilter()
    {
        this.visibleNodes = [];
        this.visibleLinks = [];

        if (this.treeModel)
        {
          this.treeModel.clearFilter();
          this.treeModel.filterNodes((node: TreeNode) => this.filter(this.visibleNodes, node), false);

          this.visibleLinks = GraphService.flatten(this.visibleNodes.map(v => {
              var links = v.data.node.links;
              return links ? links.map(l => new VisibleLink(v, l)) : [];
          }));
        }
    }

    public expandAll() {
        if (this.anyExpanded)
        {
            this.treeModel.collapseAll();
        }
        else
        {
            this.treeModel.expandAll();
        }
    }

    public selectAll() {
        if (this.anySelected)
        {
            var selectedNodes = { };
            this.treeModel.selectedLeafNodeIds = selectedNodes;
        }
        else
        {
            var selectedNodes = { };
            this.treeModel.selectedLeafNodeIds = selectedNodes;

            var processNode = n => {
                if (n.level > 0)
                    n.setIsSelected(true);
                    //selectedNodes[n.id] = true;

                for (var c of n.children)
                    processNode(c);
            };

            processNode(this.treeModel.virtualRoot);
        }
    }

    public mergedOptions(opts) { 
        return Object.assign(this.options, opts);
    }
}

@Injectable({ providedIn: 'root' })
export class GraphService {
  private docGuids = {};
  private nextDocGuid = 0;

  constructor(
    private messageService: MessageService) {
      this.addTab("ISO");
    }

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

  public static flatten(array) {
      return array.reduce((a,b)=>a.concat(b), []);
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



  // Live state management: maybe move this to a different service.  
  public graphTabs: GraphTab[] = [ ];
  public selectedTab: number = 0;

  public addTab(id: string) {
      this.getFullDocByType(id)
        .subscribe(doc => {
          var newTab = new GraphTab(id, true);

          newTab.nodes = doc.children;
          newTab.column.nodes = doc.children;

          if (this.graphTabs.length == 1) 
            this.graphTabs.splice(0, 0, newTab); // empty except iso, insert before iso only the first time.
          else
            this.graphTabs.push(newTab); // else append
            
          if (id != "ISO") 
          {
              // compare with iso.
              var stats = this.compareDocs(newTab.column, this.graphTabs[1]);
              newTab.coverage = "ISO Coverage: " + stats.coverage + ", Mapped: " + stats.mapped + ", Unique: " + stats.uniqueconnections;
          }
            
          this.selectedTab = -1; // set it to non-value so change is detected if the index is the same
          setTimeout(() => this.activateTab(newTab), 1); // need to let dom regenerate
        });
  }

  public removeTab(tab) {
      this.graphTabs = this.graphTabs.filter(t => t!=tab);
      this.activateTab(this.graphTabs[0]);
  }

  public activateTab(tab: GraphTab) {
      //for (var t of this.graphTabs)
      //{
      //    t.active = t == tab;
      //}
      
      this.selectedTab = this.graphTabs.indexOf(tab);
  }

  public getNodesWithLinks(children: FullDocNode[], result: FullDocNode[])
  {
      for (var c of children)
      {
          if (c.node.links && c.node.links.length > 0)
            result.push(c);
          this.getNodesWithLinks(c.children, result);
      }

      return result;
  }

  public flattenSections(children: FullDocNode[], result: string[])
  {
      for (var c of children)
      {
          if (c.node.body)
            result.push(c.id);
          this.flattenSections(c.children, result);
      }

      return result;
  }

  public flattenLinks(children: FullDocNode[], result: Link[], linkData: any)
  {
      for (var c of children)
      {
          if (c.node.body)
          {
            linkData.total++;
            if (c.node.links)
            {
              linkData.linked++;
              result = result.concat(c.node.links);
            }
          }
          result = this.flattenLinks(c.children, result, linkData);
      }

      return result;
  }

  public compareDocs(aTab: GraphTab, bTab: GraphTab): any {
    var bSections = [];
    this.flattenSections(bTab.nodes, bSections);
    var bCopy = bSections.slice();
    
    var linkData = { total: 0, linked: 0 };
    var aLinks = this.flattenLinks(aTab.nodes, [], linkData);

    var found = 0;
    var checked = 0;
    for (var a of aLinks)
    {
      ++checked;
      var b = bCopy.find(x => x == a.id)
      if (b)
      {
          bCopy = bCopy.filter(x => x != b);
          ++found;
      }
    }

    return {
        "coverage": found + "/" + bSections.length,
        "mapped": linkData.linked + "/" + linkData.total,
        "uniqueconnections": found + "/" + checked
        //"coverage": (found / bSections.length * 100).toFixed(1) + "% (" + found + "/" + bSections.length + ")",
        //"mapped": (linkData.linked / linkData.total * 100).toFixed(1) + "% (" + linkData.linked + "/" + linkData.total + ")",
        //"uniqueconnections": (found / checked * 100).toFixed(1) + "% (" + found + "/" + checked + ")"
    };
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
