﻿import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';
import { DAG, SNode, GraphService, CategoryList, FilterCriteria, GraphTab } from '../graph.service';
import { FullDocNode } from '../standard-map';
import { DomSanitizer } from '@angular/platform-browser';
import { debounce } from 'rxjs/operators';
import * as Rx from 'rxjs';

import { TreeModel, TreeNode, ITreeState } from 'angular-tree-component';
import Fuse from 'fuse.js';
  
 import convert from 'color-convert';

import selection_attrs from 'd3-selection-multi/src/selection/attrs';
d3.selection.prototype.attrs = selection_attrs;

class TableData
{
    constructor(
      public headers: string[],
      public rows: SNode[][]) {
    }
}

function saturateColor(input, saturationZeroToOne){
    if (input == "unset")
        return input;

    var out = '#' + convert.keyword.hex(input) + saturationZeroToOne ;
    return out;
}
 


@Component({
  selector: 'app-d3-test',
  templateUrl: './d3-test.component.html',
  styleUrls: [ './d3-test.component.css' ],
  encapsulation: ViewEncapsulation.None // Allow D3 to read styles through shadow DOM
})
export class D3TestComponent implements OnInit, OnDestroy {    
    public graphType: number = 0;
    public graphData: DAG;
    public graphCategories: CategoryList = [];
    public graphCriteria = new FilterCriteria();
    public tableData: TableData = null;
    
    public complianceColors = ["white", "green", "yellow", "red", "black"];
    public svgbgElement: any;
    private updateSubject = new Rx.BehaviorSubject(0);
    private updateViewSubject = new Rx.BehaviorSubject(0);
    private searchSubject = new Rx.BehaviorSubject(null);
    private tabsChangedSubscription;

    constructor(
      public graphService: GraphService,
      private sanitizer: DomSanitizer) {
        
        this.updateSubject.pipe(debounce(() => Rx.timer(1))).subscribe({
          next: (v) => this.updateGraph()
        });
        this.updateViewSubject.pipe(debounce(() => Rx.timer(1))).subscribe({
          next: (v) => this.updateGraphView()
        });
        this.searchSubject.pipe(debounce(() => Rx.timer(100))).subscribe({
          next: (v) => {
            if (v)
              this.filterFn(v[0], v[1]);
          }
        });
    };

    ngOnInit(): void {     
      this.graphService.getDocTypes()
        .subscribe(dt => { 
          this.graphCategories = dt; 

          //// activate first 3
          //for (var i = 0; i< 3; ++i)
          //  this.graphCategories[i].active = true;
            
          //this.RefreshGraph(); 
        });
      
      this.tabsChangedSubscription = this.graphService.tabsChangedSubject.subscribe(a => {
          //this.tabChanged();
      })
    }

    ngOnDestroy(): void {
        this.tabsChangedSubscription.unsubscribe();
    }

    public getMenuOptions(): any[] {
        var result = [];

        if (this.graphService.canAdd)
        {
            for (var t of this.graphCategories)
                if (!this.graphService.graphTabs.find(g => g.title == t.id))
                    result.push(t);
        }

        return result;
    }

    //public RefreshGraph() {
    //
    //  var limitedDocs = this.graphCategories.filter(v => v.active).map(v => v.id);
    //  if (limitedDocs.length > 0)
    //    this.graphCriteria.categoryIds = limitedDocs;
    //
    //  this.graphCriteria.categoryOrder = limitedDocs;
    //
    //  if (this.graphType == 1)
    //  {
    //      // move ISO to second slot so it draws in the middle
    //      var i0 = this.graphCriteria.categoryOrder[0];
    //      var i1 = this.graphCriteria.categoryOrder[1];
    //      this.graphCriteria.categoryOrder[0] = i1;
    //      this.graphCriteria.categoryOrder[1] = i0;
    //  }
    //
    //  this.graphService.getGraphData2(this.graphCriteria)
    //    .subscribe(gd => { 
    //      console.log(JSON.stringify(gd)); 
    //      this.graphData = gd;
    //
    //      switch (this.graphType)
    //      {
    //          case 0:
    //            this.DrawTable(this.graphData);
    //            break;
    //          case 1:
    //            this.DrawChart(this.graphData);
    //            break;
    //          case 2:
    //            this.DrawGraph(this.graphData);
    //            break;
    //    }
    //    });
    //}

    private DrawTable(data: DAG) {
        var rowType = this.graphCriteria.categoryOrder ? this.graphCriteria.categoryOrder[0] : (data.nodes[0] as SNode).data.type;
        var headerTypes = this.graphCriteria.categoryOrder.filter(v => v != rowType);

        var headerNodes = [rowType].concat(headerTypes);
        var rowNodes = data.nodes.filter(v => v.data.type == rowType).map(d => {
                var links = headerTypes.map(h => {
                  for (var l of data.links)
                  {
                     var node = null;

                     if (l.source == d.nodeId && l.targetNode.data.type == h)
                        node = l.targetNode;

                     if (l.target == d.nodeId && l.sourceNode.data.type == h)
                        node = l.sourceNode;

                     if (node)
                        return node;
                  }

                  return null;
                });

                return [d].concat(links);
            });

        var width = 960;
        var height = 500;

        // clear
        d3.selectAll("#d3").selectAll("*").remove();

        this.tableData = new TableData(headerNodes, rowNodes);
    }

    private DrawChart(energy: DAG) {
        var width = 960;
        var height = 500;

        // clear
        d3.selectAll("#d3").selectAll("*").remove();
        this.tableData = null;

        var svg = d3.selectAll("#d3").append("svg");
            svg.attr("width", width);
            svg.attr("height", height);

        var formatNumber = d3.format(",.0f"),
            format = function (d: any) { return formatNumber(d) + " TWh"; },
            color = d3.scaleOrdinal(d3.schemeCategory10);

        var sankey = d3Sankey.sankey()
            .nodeWidth(15)
            .nodePadding(10)
            .extent([[1, 1], [width - 1, height - 6]]);

        var link = svg.append("g")
            .attr("class", "links")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.2)
            .selectAll("path");

        var node = svg.append("g")
            .attr("class", "nodes")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .selectAll("g");

            sankey.nodeAlign(d3Sankey.sankeyLeft);
            //sankey.nodeAlign((n, d) => {
            //  return this.graphCriteria.categoryOrder.indexOf(n.data.type);
            //});
            sankey.nodeSort((a: SNode, b: SNode) => a.name < b.name ? -1 : 1);
            sankey.nodeId((d: SNode) => d.nodeId);
            sankey.nodeWidth(250);

            sankey(energy);

            link = link
                .data(energy.links);

            link.enter().append("path")
                .attr("d", d3Sankey.sankeyLinkHorizontal())
                .attr("stroke-width", function (d: any) { return 10; }) //Math.max(1, d.width) * 0.; })
                .attr("stroke", d => "black") //color(d.source.name))
                .on('click', function(d, i) {
                  console.log("clicked link", d);
                })
                .on("mouseover", function(d) {
                    d3.select(this).style("cursor", "pointer"); 
                  });

            link.append("title")
                .text(function (d: any) { return d.source.name + " → " + d.target.name + "\n" + format(d.value) + "\n" + d.uom; });

            node = node
                .data(energy.nodes)
                .enter().append("g");

            node.append("rect")
                .attr("x", function (d: any) { return d.x0; })
                .attr("y", function (d: any) { return d.y0; })
                .attr("height", function (d: any) { return d.y1 - d.y0; })
                .attr("width", function (d: any) { return d.x1 - d.x0; })
                .attr("fill", d => { return this.complianceColors[energy.nodes[d.index].data.compliance_level]; } ) //color(d.name.replace(/ .*/, "")); })
                .attr("stroke", "#000")
                .on('click', function(d, i) {
                  console.log("clicked node", d);
                })
                .on("mouseover", function(d) {
                    d3.select(this).style("cursor", "pointer"); 
                  });

            node.append("text")
                .attr("x", function (d: any) { return d.x0 + 6; }) //{ return d.x0 - 6; })
                .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
                .attr("dy", "0.35em")
                .attr("text-anchor", "start")
                .text(function (d: any) { return d.name + "\n" + d.data.body; });
                //.filter(function (d: any) { return d.x0 < width / 2; })
                //.attr("x", function (d: any) { return d.x1 + 6; })
                //.attr("text-anchor", "start");

            node.append("title")
                .text(function (d: any) { return d.name + "\n" + d.data.body; });
    }

    private DrawGraph(data: DAG) {
        var width = 960;
        var height = 500;

        // clear
        d3.selectAll("#d3").selectAll("*").remove();
        this.tableData = null;

        var svg = d3.selectAll("#d3").append("svg");
            svg.attr("width", width);
            svg.attr("height", height);

        var link, node, edgelabels, edgepaths;
            
        var colors = d3.scaleOrdinal(d3.schemeCategory10);
        svg.append('defs').append('marker')
            .attrs({'id':'arrowhead',
                'viewBox':'-0 -5 10 10',
                'refX':13,
                'refY':0,
                'orient':'auto',
                'markerWidth':13,
                'markerHeight':13,
                'xoverflow':'visible'})
            .append('svg:path')
            .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
            .attr('fill', '#999')
            .style('stroke','none');

        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function (d) {return d.nodeId;}).distance(100).strength(1))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2));

        update(data.links, data.nodes);

        function update(links, nodes) {
            link = svg.selectAll(".link")
                .data(links)
                .enter()
                .append("line")
                .attr("class", "link")
                .attr('marker-end','url(#arrowhead)');

            link.append("title")
                .text(function (d) {return ""; }); //d.type;});

            edgepaths = svg.selectAll(".edgepath")
                .data(links)
                .enter()
                .append('path')
                .attrs({
                    'class': 'edgepath',
                    'fill-opacity': 0,
                    'stroke-opacity': 0,
                    'id': function (d, i) {return 'edgepath' + i}
                })
                .style("pointer-events", "none");

            edgelabels = svg.selectAll(".edgelabel")
                .data(links)
                .enter()
                .append('text')
                .style("pointer-events", "none")
                .attrs({
                    'class': 'edgelabel',
                    'id': function (d, i) {return 'edgelabel' + i},
                    'font-size': 10,
                    'fill': '#aaa'
                });

            edgelabels.append('textPath')
                .attr('xlink:href', function (d, i) {return '#edgepath' + i})
                .style("text-anchor", "middle")
                .style("pointer-events", "none")
                .attr("startOffset", "50%")
                .text(function (d) {return ""; });

            node = svg.selectAll(".node")
                .data(nodes)
                .enter()
                .append("g")
                .attr("class", "node")
                .call(d3.drag()
                        .on("start", dragstarted)
                        .on("drag", dragged)
                        //.on("end", dragended)
                );

            node.append("circle")
                .attr("r", 5)
                .style("fill", function (d, i) {return colors(i);})

            node.append("title")
                .text(function (d) {return d.nodeId;});

            node.append("text")
                .attr("dy", -3)
                .text(function (d) {return d.name;});

            simulation
                .nodes(nodes)
                .on("tick", ticked);

            simulation.force("link")
                .links(links);
        }

      function ticked() {
          link
              .attr("x1", function (d) {return d.source.x;})
              .attr("y1", function (d) {return d.source.y;})
              .attr("x2", function (d) {return d.target.x;})
              .attr("y2", function (d) {return d.target.y;});

          node
              .attr("transform", function (d) {return "translate(" + d.x + ", " + d.y + ")";});

          edgepaths.attr('d', function (d) {
              return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
          });

          edgelabels.attr('transform', function (d) {
              if (d.target.x < d.source.x) {
                  var bbox = this.getBBox();

                  var rx = bbox.x + bbox.width / 2;
                  var ry = bbox.y + bbox.height / 2;
                  return 'rotate(180 ' + rx + ' ' + ry + ')';
              }
              else {
                  return 'rotate(0)';
              }
          });
      }

      function dragstarted(d) {
          if (!d3.event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x;
          d.fy = d.y;
      }

      function dragged(d) {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
      }
    }

    public filter(value: string, treeModel: TreeModel) {
        this.searchSubject.next([value, treeModel]);
    }

    public filterFn(value: string, treeModel: TreeModel) {
      if (value != "")
        treeModel.filterNodes((node: TreeNode) => this.fuzzysearch(value, node));
      else
        treeModel.filterNodes((node: TreeNode) => this.clearSearch(node));
    }

    public tabChanged() {
        this.graphService.configureFilterStack();

        if (this.graphService.selectedTab >= 0 && this.graphService.selectedTab < this.graphService.graphTabs.length)
        {
            this.graphService.graphTabs[this.graphService.selectedTab].parentTabTreeChanged(this.updateSubject);
        }
    }

    public activateNode(tab: GraphTab, event: any) {
        if (tab.column.treeModel) {
            var newSelection = {};
            newSelection[tab.column.state.focusedNodeId] = true; // single select
            tab.column.state.activeNodeIds = newSelection; 
            
            this.updateSubject.next(0);
        }
    }

    public onResize(event) {
        //event.target.innerWidth;
        this.updateViewSubject.next(0);
    }

    private buildLinkSet(fromTab: GraphTab, toTab: GraphTab, rtl: boolean): void {
        
        // For all the links that are not filtered already
        var links = fromTab.visibleLinks;

        // make a hash table from source _root_ node id, to list of links. 
        //  The source _root_ node is the first node in the ascenstery that is visible (parent is not collpased)
        var rollup = links.reduce((a, b) => {
            var owner = b.fromNode;

            // Iterate to root, keep track of highest collapsed node.
            var iterator = owner;
            while (iterator.realParent)
            {
              iterator = iterator.realParent;
              if (iterator.isCollapsed)
                owner = iterator;
            }

            // Create the list if it doesnt exist
            if (!(owner.id in a))
                a[owner.id] = [];

            // add the link
            a[owner.id].push(b);
            return a;
        }, { });

        // for each source root node, aggregate links to destination root nodes
        //  destination _root_ nodes are the first node in the ascenstery that is visible (parent is not collpased)
        var rollup2 = Object.keys(rollup).map(k => {
            var collapsed = rollup[k].reduce((a, b) => {
                var link = b.link;
                var owner = toTab.treeModel.getNodeById(link.id);

                // Iterate to root, keep track of highest collapsed node.
                var iterator = owner;
                while (iterator.realParent)
                {
                  iterator = iterator.realParent;
                  if (iterator.isCollapsed)
                    owner = iterator;
                }
                
                // Create the list if it doesnt exist
                if (!(owner.id in a))
                    a[owner.id] = [];

                // add the link
                a[owner.id].push(link);
                return a;
            }, { });

            return [k, collapsed];
        });

        // Create one aggregated list of links with all the necessary parameters for the view
        // start with the links map from source root node, to destination root nodes 
        var flatten = rollup2.reduce((a, b) => {
            var fromTree = fromTab.treeModel;
            var toTree = toTab.treeModel;
            var destinationMap = b[1];
            var fromNode = fromTree.getNodeById(b[0]);

            // If the source node is hidden, continue.
            if (fromNode.id in fromTree.hiddenNodeIds)
              return a;

            // one source node may map to many destination.
            for (var destinationKey in destinationMap)
            {
              var toNode = toTree.getNodeById(destinationKey);                  
              if (!(toNode.id in toTree.hiddenNodeIds))
              {
                var destinationData = destinationMap[destinationKey];
                a.push({
                    from: b[0],
                    fromNode: fromNode,
                    to: destinationKey,
                    toNode: toNode,
                    fromTree: fromTree,
                    toTree: toTree,
                    rtl: rtl,
                    scale: rtl ? -1 : 1,
                    weight: (fromNode.isActive || toNode.isActive) ? 2 : 1,
                    x1: 0,
                    x2: 0,
                    x3: 0,
                    x4: 0,
                    y1: 0,
                    y2: 0,
                });
              }
            }
            return a;
        }, []);

        fromTab.displayLinks = flatten;
    }

    public updateGraph() {
        var tabs = this.graphService.graphTabs;

        // delay the rendering so dom can settle.
        //setTimeout(a => {
            var isoTab = tabs.find(t => t.isIso);
            var isoIndex = tabs.indexOf(isoTab);

            for (var t = 0; t < tabs.length; ++t)
            {
                var tab = tabs[t];
                if (tab != isoTab)
                  this.buildLinkSet(tab.column, isoTab.column, t > isoIndex);
            }
            
            this.updateViewSubject.next(0);
        //}, 1);
    }

    public updateGraphView() {
        if (!this.svgbgElement)
            return;

        var tabs = this.graphService.graphTabs;        
        var startingGapLeft = 0;
        var startingGapRight = 10;
        var arrowLength = 10;
        var svgBounds = this.svgbgElement.getBoundingClientRect();

        for (var tab of tabs)
        {
          for (var l of tab.column.displayLinks)
          {
            var fromBounds = l.fromNode.elementRef2.getBoundingClientRect();
            var toBounds = l.toNode.elementRef2.getBoundingClientRect();

            l.x1 = (l.rtl ? (fromBounds.left - startingGapRight) : (fromBounds.right + startingGapLeft)) - svgBounds.left;
            l.x2 = (l.rtl ? (toBounds.right + arrowLength) : (toBounds.left - arrowLength)) - svgBounds.left;
            l.y1 = fromBounds.top - svgBounds.top + fromBounds.height * 0.5;
            l.y2 = toBounds.top - svgBounds.top + toBounds.height * 0.5;
            
            // Locations for the arrow head
            l.x3 = l.x2 - 2 * l.scale;
            l.x4 = l.x2 + 0.1 * l.scale;
          }
        }
    }

    public setup(data, treeElement) {
        data.treeModel = treeElement.treeModel;
        treeElement.viewportComponent.elementRef.nativeElement.addEventListener('scroll', t => this.updateGraphView()); 
    }

    public clickedLink(link: any) {
        link.fromTree.getNodeById(link.from).expandAll();
        link.toTree.getNodeById(link.to).expandAll();
    }

    public bindTogether(node, element, svgbg) {
        node.elementRef2 = element;
        this.svgbgElement = svgbg;
    }

    public clearSearch(node: TreeNode): boolean {
        node.data.highlight = undefined;
        return true;
    }

    public fuzzysearch(searchTerm: string, node: TreeNode): boolean {
      var options = {
         includeMatches: true,
         includeScore: true,
         shouldSort: false,
         tokenize: false,
         threshold: 0.3,
         location: 0,
         distance: 800,
         maxPatternLength: 32,
         minMatchCharLength: 3,
      };

      var result = [];
      var scoreThresh = 0;
      var inName = false;
      
      // Test body first
      if (node.data.node.body)
      {
          if (!node.data.bodyFuse)
          {
              node.data.bodyFuse = new Fuse([node.data.node.body], options);
          }

          result = node.data.bodyFuse.search(searchTerm);
          result = result.filter(a => a.score > scoreThresh);
      }

      if (result.length == 0)
      {
          // test title
          if (!node.data.sectionFuse)
          {
              node.data.sectionFuse = new Fuse([node.data.node.section], options);
          }

          result = node.data.sectionFuse.search(searchTerm);
          result = result.filter(a => a.score > scoreThresh);
          inName = true;
      }

      if (result.length > 0)
      {
          // record the longest matching span for highlight
          var length = -1;
          var longest = undefined;
          var match = result[0].matches[0];
          if (match)
          {
              for (var span of match.indices)
              {
                  var newLength = span[1] - span[0];
                  if (newLength > length)
                  {
                      length = newLength;
                      longest = span;
                      span[1] += 1; // convert ending index to js substring convention of end + 1
                  }
              }
          }

          node.data.highlight = longest;
          node.data.highlightName = inName;
          return true;
      }

      node.data.highlight = undefined;
      return false;
    }

    private highlightText(text: string, highlight: number[]): string
    {
        return text.substring(0, highlight[0]) + "<mark>" + text.substring(highlight[0], highlight[1]) + "</mark>" + text.substring(highlight[1], text.length);
    }

    public injectHighlightSection(data: FullDocNode) 
    {
        var section = data.node.section;

        if (data.highlight && data.highlightName)
            section = this.highlightText(section, data.highlight);

        return this.sanitizer.bypassSecurityTrustHtml(section);
    }

    public injectHighlightBody(data: FullDocNode) 
    {
        var body = data.node.body;
        if (body)
        {
            if (data.highlight && !data.highlightName)
            {
                body = this.highlightText(body, data.highlight);
            }
        
            body = " - " + body;
        }   
        else
            body = "";


        return this.sanitizer.bypassSecurityTrustHtml(body);
    }

    public openTab(url: string)
    {
        window.open(url, "_blank").focus();
    }

    public getNodeColor(tab: GraphTab, node: TreeNode)
    {
        // if we're a tree in the right side view, highlight active nodes
        var selected = (tab.parent && node.isActive);
        var color = selected ? 'lightblue' : 'unset';

        if (tab.parent && node.data.filterColor)
        {
            if (!tab.isIso && node.data.isUnmapped)
            {
                color = 'red';
            }
            else if (!selected)
            {
                color = node.data.filterColor;
            }
        }
        else if (!tab.isIso)
        {
            // Iso never has outward mappings
            if (node.data.isUnmapped)
            {
                color = 'red';
            }
            else if (node.data.isAnyChildUnmapped)
            {
                color = 'pink';
            }
        }

        // if we're a tree in the right side view
        if (tab.parent && !node.isActive)
        {
            // desaturate background color unless active node
            color = saturateColor(color, 'A0');
        }
        
        return color;
    }

    public filterMapped(tab: GraphTab)
    {
        tab.filterMapped();
        this.graphService.activateTab(tab);
    }

    public filterIsoCoverage(tab: GraphTab)
    {
        var isoTab = this.graphService.graphTabs[1];
        isoTab.filterToIds(tab.coverage.uncoveredIds);
        this.graphService.activateTab(isoTab);
    }
}