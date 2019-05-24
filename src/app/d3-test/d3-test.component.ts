import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';
import { DAG, SNode, GraphService, CategoryList, FilterCriteria, GraphTab } from '../graph.service';

import { TreeModel, TreeNode, ITreeState } from 'angular-tree-component';

import selection_attrs from 'd3-selection-multi/src/selection/attrs';
d3.selection.prototype.attrs = selection_attrs;

class TableData
{
    constructor(
      public headers: string[],
      public rows: SNode[][]) {
    }
}

@Component({
  selector: 'app-d3-test',
  templateUrl: './d3-test.component.html',
  styleUrls: [ './d3-test.component.css' ],
  encapsulation: ViewEncapsulation.None // Allow D3 to read styles through shadow DOM
})
export class D3TestComponent implements OnInit {    
    public graphType: number = 0;
    public graphData: DAG;
    public graphCategories: CategoryList = [];
    public graphCriteria = new FilterCriteria();
    public tableData: TableData = null;
    
    public complianceColors = ["white", "green", "yellow", "red", "black"];
    public svgbgElement: any;

    constructor(
      private graphService: GraphService) {
        //this.graphTabs[1].column.filter = (vs, n) => GraphTab.filterByVisibleLinks(vs, this.graphTabs[0].column.visibleLinks, n);
        ////this.graphTabs[2].column.filter = (vs, n) => GraphTab.filterByVisibleLinks(vs, this.graphTabs[1].column.visibleLinks, n);
    };

    ngOnInit(): void {     
      this.graphService.getDocTypes()
        .subscribe(dt => { 
          this.graphCategories = dt; 

          // activate first 3
          for (var i = 0; i< 3; ++i)
            this.graphCategories[i].active = true;
            
          this.RefreshGraph(); 
        });
    }

    public getMenuOptions(): any[] {
        var result = [];
        for (var t of this.graphCategories)
            if (!this.graphService.graphTabs.find(g => g.title == t.id))
                result.push(t);
        return result;
    }

    public RefreshGraph() {

      var limitedDocs = this.graphCategories.filter(v => v.active).map(v => v.id);
      if (limitedDocs.length > 0)
        this.graphCriteria.categoryIds = limitedDocs;

      this.graphCriteria.categoryOrder = limitedDocs;

      if (this.graphType == 1)
      {
          // move ISO to second slot so it draws in the middle
          var i0 = this.graphCriteria.categoryOrder[0];
          var i1 = this.graphCriteria.categoryOrder[1];
          this.graphCriteria.categoryOrder[0] = i1;
          this.graphCriteria.categoryOrder[1] = i0;
      }

      this.graphService.getGraphData2(this.graphCriteria)
        .subscribe(gd => { 
          console.log(JSON.stringify(gd)); 
          this.graphData = gd;

          switch (this.graphType)
          {
              case 0:
                this.DrawTable(this.graphData);
                break;
              case 1:
                this.DrawChart(this.graphData);
                break;
              case 2:
                this.DrawGraph(this.graphData);
                break;
        }
        });
    }

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

    public filterFn(value: string, treeModel: TreeModel) {
      treeModel.filterNodes((node: TreeNode) => this.fuzzysearch(value, node.data.name) || (node.data.node.body && this.fuzzysearch(value, node.data.node.body)));
    }

    public tabTreeChanged(tab: GraphTab) {
        if (tab.column.treeModel) {

            // Due to a bug https://github.com/500tech/angular-tree-component/issues/521
            //  must manually clear nodes that are no longer selected
            for (var n of Object.keys(tab.treeModel.selectedLeafNodeIds))
            {
                var node = tab.treeModel.getNodeById(n);
                if (!node.isSelected)
                  delete tab.treeModel.selectedLeafNodeIds[n];
            }

            this.updateGraph();
        }
    }

    public columnTabTreeChanged(tab: GraphTab) {
        if (tab.column.treeModel) {
            this.updateGraph();
        }
    }

    public onResize(event) {
        //event.target.innerWidth;
        this.updateGraph();
    }

    private buildLinkSet(fromTab: GraphTab, toTab: GraphTab, rtl: boolean): void {
        
        var links = fromTab.visibleLinks;
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

            if (!(owner.id in a))
                a[owner.id] = [];
            a[owner.id].push(b);
            return a;
        }, { });

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

                if (!(owner.id in a))
                    a[owner.id] = [];
                a[owner.id].push(link);
                return a;
            }, { });

            return [k, collapsed];
        });
        
        var inset = -5;
        var outset = 10;

        var svgBounds = this.svgbgElement.getBoundingClientRect();
        var flatten = rollup2.reduce((a, b) => {
            var fromTree = fromTab.treeModel;
            var toTree = toTab.treeModel;
            for (var l in b[1])
            {
              var fromNode = fromTree.getNodeById(b[0]);
              var toNode = toTree.getNodeById(l);
                  
              if (!(fromNode.id in fromTree.hiddenNodeIds || toNode.id in toTree.hiddenNodeIds))
              {
                var fromBounds = fromNode.elementRef2.getBoundingClientRect();
                var toBounds = toNode.elementRef2.getBoundingClientRect();
              
                a.push({
                    from: b[0], 
                    to: l,
                    x1: (rtl ? (fromBounds.left - outset) : (fromBounds.right - inset)) - svgBounds.left,
                    x2: (rtl ? (toBounds.right - inset) : (toBounds.left - outset)) - svgBounds.left,
                    y1: fromBounds.top - svgBounds.top + fromBounds.height * 0.5,
                    y2: toBounds.top - svgBounds.top + toBounds.height * 0.5,
                    scale: rtl ? -1 : 1
                });
              }
            }
            return a;
        }, []);

        fromTab.displayLinks = flatten;
    }

    public updateGraph() {
        var tabs = this.graphService.graphTabs;

        for (var tab of tabs)
        {
            // filter child tree
            tab.column.runFilter();
        }

        // delay the rendering so dom can settle.
        setTimeout(a => {
            var isoTab = tabs.find(t => t.isIso);
            var isoIndex = tabs.indexOf(isoTab);

            for (var t = 0; t < tabs.length; ++t)
            {
                var tab = tabs[t];
                if (tab != isoTab)
                  this.buildLinkSet(tab.column, isoTab.column, t > isoIndex);
            }
        }, 100);
    }

    public bindTogether(node, element, svgbg) {
        node.elementRef2 = element;
        this.svgbgElement = svgbg;
    }

    public fuzzysearch(needle: string, haystack: string) {
      const haystackLC = haystack.toLowerCase();
      const needleLC = needle.toLowerCase();

      const hlen = haystack.length;
      const nlen = needleLC.length;

      if (nlen > hlen) {
        return false;
      }
      if (nlen === hlen) {
        return needleLC === haystackLC;
      }
      outer: for (let i = 0, j = 0; i < nlen; i++) {
        const nch = needleLC.charCodeAt(i);

        while (j < hlen) {
          if (haystackLC.charCodeAt(j++) === nch) {
            continue outer;
          }
        }
        return false;
      }
      return true;
    }
}