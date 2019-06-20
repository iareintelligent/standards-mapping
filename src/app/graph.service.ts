import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of, forkJoin } from 'rxjs';
import * as Rx from 'rxjs';
import { catchError, map, tap, debounce } from 'rxjs/operators';

import { StandardMap, FullDocNode, DocNode, DocNode2, Doc2, Link } from './standard-map';
import { MessageService } from './message.service';
import * as d3Sankey from 'd3-sankey';
import { TreeModel, TreeNode, ITreeState, TREE_ACTIONS, IActionMapping } from 'angular-tree-component';

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
    public options = {
      useCheckbox: true,
      allowDrag: false,
      allowDrop: false,
      scrollOnActivate: false,
      scrollContainer: <HTMLElement>document.body, // Fix for bug: https://github.com/500tech/angular-tree-component/issues/704
      //actionMapping: {
      //  mouse: {
      //    click: (tree, node, $event) => { 
      //      //$event.preventDefault();
      //      TREE_ACTIONS.TOGGLE_SELECTED_MULTI(tree, node, $event); 
      //    },
      //  }
      //}
    };

    public state: ITreeState = { };
    public treeModel: TreeModel;
    public visibleNodes: TreeNode[] = [];
    public visibleLinks: VisibleLink[] = [];
    public displayLinks: any[] = [];
    public isIso: boolean = false;
    public searchValue: string = null;
    public coverage: any = null;
    public autoFilterSrc: GraphTab;
    public autoFilterSelf: boolean;
    public autoFilterParent: GraphTab;
    private updateSubjectParent = new Rx.BehaviorSubject(null);
    private updateSubjectColumn = new Rx.BehaviorSubject(null);

    constructor(
      public title: string,
      public graphService: GraphService,
      public parent: GraphTab = null) {
        this.isIso = title == "ISO";

        if (!parent)
        {
          this.column = new GraphTab(title, this.graphService, this);
          this.column.options.useCheckbox = false;
        
          this.updateSubjectParent.pipe(debounce(() => Rx.timer(10))).subscribe({
            next: (v) => this.parentTabTreeChangedImp(v)
          });
        
          this.updateSubjectColumn.pipe(debounce(() => Rx.timer(10))).subscribe({
            next: (v) => this.columnTabTreeChangedImp(v)
          });
        }
    }


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
        var inSelection = node.data.id in parentTree.selectedLeafNodeIds;
        node.data.filterColor = inSelection ? "yellow" : undefined;

        var show = inSelection || Object.keys(parentTree.selectedLeafNodeIds).length == 0;
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

    public static filterByMyLinks(visibleNodes: TreeNode[], parentTree: GraphTab, node: TreeNode): boolean
    {
        // keep unmapped stuff by default
        var show = node.data.isUnmapped;

        if (!show)
        {
            // include linked stuff
            var links = node.data.node.links;
            if (links)
            {
                for (var l of links)
                {
                    if (!(l.id in parentTree.state.hiddenNodeIds) || !parentTree.state.hiddenNodeIds[l.id])
                    {
                        show = true;
                        break;
                    }
                }
            }
        }

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

          this.treeModel.filterNodes((node: TreeNode) => {
            var show = false;
            if (this.autoFilterSrc)
            {
                if (this.autoFilterSelf)
                {
                    show = GraphTab.filterByMyLinks(this.visibleNodes, this.autoFilterSrc, node);
                }
                else
                    show = GraphTab.filterByVisibleLinks(this.visibleNodes, this.autoFilterSrc.visibleLinks, node);
            }
            else
                show = GraphTab.filterBySelectedLeafs(this.visibleNodes, this.parent.treeModel, node);
                
            return show;
          }, false);

          if (this.autoFilterParent)
          {
              if (this.autoFilterParent.anySelected)
                this.treeModel.expandAll();
              else
                this.treeModel.collapseAll();
          }

          this.visibleLinks = GraphService.flatten(this.visibleNodes.map(v => {
              var links = v.data.node.links;
              return links ? links.map(l => new VisibleLink(v, l)) : [];
          }));
        }
    }

    public filterMapped()
    {
        // collapse all
        this.forAllTreeNodes(n => n.collapse());

        this.treeModel.selectedLeafNodeIds = { };

        var scrolledOnce = false;
        this.forAllTreeNodes(n => {
            if (n.level > 0)
            {
                n.setIsSelected(n.data.isUnmapped);
                if (n.data.isUnmapped)
                {
                    n.ensureVisible();
                    if (!scrolledOnce)
                    {
                        scrolledOnce = true;
                        n.scrollIntoView();
                    }
                }
            }
        });
    }

    public filterToIds(ids: string[])
    {
        // collapse all
        this.forAllTreeNodes(n => n.collapse());

        this.treeModel.selectedLeafNodeIds = { };

        var scrolledOnce = false;
        this.forAllTreeNodes(n => {
            if (n.level > 0)
            {
                var select = ids.includes(n.id);

                n.setIsSelected(select);
                if (select)
                {
                    n.ensureVisible();
                    if (!scrolledOnce)
                    {
                        scrolledOnce = true;
                        n.scrollIntoView();
                    }
                }
            }
        });
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
            this.treeModel.selectedLeafNodeIds = { };
        }
        else
        {
            this.treeModel.selectedLeafNodeIds = { };
            this.forAllTreeNodes(n => {
                if (n.level > 0)
                    n.setIsSelected(true);
            });
        }
    }

    public mergedOptions(opts) { 
        return Object.assign(this.options, opts);
    }

    // Due to a bug in the tree control (forall is async but does not return the promise)
    //   create our own synchronous forall
    public forAllTreeNodes(cb: (tn: TreeNode) => void)
    {
      for (var n of this.treeModel.roots)
        this.forAllTreeNodesRecursive(n, cb);
    }

    private forAllTreeNodesRecursive(node: TreeNode, cb: (tn: TreeNode) => void)
    {
      cb(node);
      if (node.children)
      {
        for (var n of node.children)
          this.forAllTreeNodesRecursive(n, cb);
      }
    }

    public parentTabTreeChanged(updateSubject: any) {
        this.updateSubjectParent.next([updateSubject]);
    }

    public parentTabTreeChangedImp(data: any) {
        if (!data)
            return;

        var updateSubject = data[0];

        if (this.column.treeModel) {

            // Due to a bug https://github.com/500tech/angular-tree-component/issues/521
            //  must manually clear nodes that are no longer selected
            for (var n of Object.keys(this.treeModel.selectedLeafNodeIds))
            {
                var node = this.treeModel.getNodeById(n);
                if (node && !node.isSelected)
                  delete this.treeModel.selectedLeafNodeIds[n];
            }
            
            this.graphService.runFilters(this, true, updateSubject);
            
            updateSubject.next(0);
            
            // Must be delayed or you'll get an infinite loop of change events.
            setTimeout(() => {
              // by default, collapse everything
              this.column.forAllTreeNodes(n => n.collapse());

              // ensure selected nodes are visible
              for (var n in this.treeModel.selectedLeafNodeIds)
              {
                var columnNode = this.column.treeModel.getNodeById(n);
                if (columnNode)
                  columnNode.ensureVisible();
              }
            }, 1);
        }
    }

    public columnTabTreeChanged(event: any, updateSubject: any) {
        this.updateSubjectColumn.next([event, updateSubject]);
    }

    public columnTabTreeChangedImp(data: any) {
        if (!data)
            return;

        var event = data[0];
        var updateSubject = data[1];
        if (this.column.treeModel) {
            if (event)
            {
              // on expand
              if (event.isExpanded && event.node.isActive)
              {
                var allNodes = this.graphService.getNodesWithLinks(event.node.data.children, []);

                // select children with links
                for (var c of allNodes)
                {
                  this.column.state.activeNodeIds[c.id] = true; // select child
                }
              }
            }
            
            this.graphService.runFilters(this, false, updateSubject);
            
            updateSubject.next(0);
        }
    }
}

@Injectable({ providedIn: 'root' })
export class GraphService {
  private docGuids = {};
  private nextDocGuid = 0;
  public tabsChangedSubject = new Rx.BehaviorSubject(0);

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

  public runFilters(changedTab: GraphTab, parentChanged: boolean, updateSubject: any) 
  {
      var tabs = this.graphTabs;
      for (var t of tabs)
      {
          if (t.column.autoFilterSrc == changedTab.column || (parentChanged && t == changedTab))
          {
              // filter child tree
              t.column.runFilter();
              t.columnTabTreeChanged(null, updateSubject);
          }
      }
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

  public get canAdd(): boolean {
      return this.graphTabs.length < 3;
  }

  public addTab(id: string) {
      if (!this.canAdd)
          return;

      this.getFullDocByType(id)
        .subscribe(doc => {
          var newTab = new GraphTab(id, this);

          newTab.nodes = doc.children;
          newTab.column.nodes = doc.children;

          this.graphTabs.push(newTab);
          this.ensureISOIsInMiddle();
            
          if (id != "ISO") 
          {
              // compare with iso.
              newTab.coverage = this.compareDocs(newTab.column, this.graphTabs[1]);
          }
            
          this.selectedTab = -1; // set it to non-value so change is detected if the index is the same
          setTimeout(() => this.activateTab(newTab), 1); // need to let dom regenerate

          this.tabsChangedSubject.next(0);
        });
  }

  private ensureISOIsInMiddle() {
      var isoTab = this.graphTabs.find(t => t.title == "ISO");

      if (this.graphTabs.length > 1)
      {
          this.graphTabs = this.graphTabs.filter(t => t != isoTab);
          this.graphTabs.splice(1, 0, isoTab);
      }

      this.configureFilterStack();
  }

  public configureFilterStack() {
      var filterOrder = [];
      switch (this.selectedTab)
      {
        case 0: filterOrder = [0, 1, 2]; break;
        case 1: filterOrder = [1, 0, 2]; break;
        case 2: filterOrder = [2, 1, 0]; break;
      }

      // setup filters
      var isoTab = this.graphTabs.find(t => t.title == "ISO");
      var primary = this.graphTabs[filterOrder[0]];
      
      // clear auto filter of left tab
      primary.column.autoFilterSrc = null;
      primary.column.autoFilterParent = null;
      primary.column.autoFilterSelf = false;

      var secondary = this.graphTabs[filterOrder[1]];
      if (secondary)
      {
          if (secondary == isoTab)
          {
              // assure iso filters from the primary: "auto filter"
              isoTab.column.autoFilterSrc = primary.column;
              isoTab.column.autoFilterParent = primary.column.parent;
              isoTab.column.autoFilterSelf = false;
          }
          else
          {
              // auto filter with this tabs connections to iso
              secondary.column.autoFilterSrc = isoTab.column;
              secondary.column.autoFilterParent = primary.column.parent; // the primary tab always drives the selection
              secondary.column.autoFilterSelf = true;
          }
      }

      var third = this.graphTabs[filterOrder[2]];
      if (third)
      {
          // auto filter with this tabs connections to iso
          third.column.autoFilterSrc = isoTab.column;
          third.column.autoFilterParent = primary.column.parent; // the primary tab always drives the selection
          third.column.autoFilterSelf = true;
      }
  }

  public removeTab(tab) {
      this.graphTabs = this.graphTabs.filter(t => t!=tab);
      this.ensureISOIsInMiddle();
      this.activateTab(this.graphTabs[0]);
      this.tabsChangedSubject.next(0);
  }

  public activateTab(tab: GraphTab) {
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
            if (c.node.links && c.node.links.length)
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
        coverage: found + "/" + bSections.length,
        mapped: linkData.linked + "/" + linkData.total,
        uniqueconnections: found + "/" + checked,
        uncoveredIds: bCopy

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
