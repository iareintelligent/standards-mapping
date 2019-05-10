﻿import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';
import { DAG, SNode, GraphService, CategoryList, FilterCriteria } from '../graph.service';

import selection_attrs from 'd3-selection-multi/src/selection/attrs';
d3.selection.prototype.attrs = selection_attrs;

@Component({
  selector: 'app-d3-test',
  templateUrl: './d3-test.component.html',
  styleUrls: [ './d3-test.component.css' ],
  encapsulation: ViewEncapsulation.None // Allow D3 to read styles through shadow DOM
})
export class D3TestComponent implements OnInit {    
    private graphType: number = 0;
    private graphData: DAG;
    private graphCategories: CategoryList = [];
    private graphCriteria = new FilterCriteria();
    
    private complianceColors = ["white", "green", "yellow", "red", "black"];

    constructor(
      private graphService: GraphService) {
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

    private RefreshGraph() {

      var limitedDocs = this.graphCategories.filter(v => v.active).map(v => v.id);
      if (limitedDocs.length > 0)
        this.graphCriteria.categoryIds = limitedDocs;

      this.graphCriteria.categoryOrder = limitedDocs;

      if (this.graphType == 0)
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
                this.DrawChart(this.graphData);
                break;
              case 1:
                this.DrawTable(this.graphData);
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
                        return [node.data.section, node.data.compliance_level];
                  }

                  return ["-", 0];
                });

                return [[d.name, d.data.compliance_level]].concat(links);
            });

        var width = 960;
        var height = 500;

        // clear
        d3.selectAll("#d3").selectAll("*").remove();

        var table = d3.selectAll("#d3").append("table");
        var header = table.append("thead").append("tr");

        header
            .selectAll("th")
            .data(headerNodes)
            .enter()
            .append("th")
            .text(function (d) {
                return d;
            });

        var tBody = table.append("tbody");

        var rows = tBody.selectAll("tr")
            .data(rowNodes)
            .enter()
            .append("tr");
            
        var cells = rows
            .selectAll("td")
            .data(function (d) { return d })
            .enter()
            .append("td")
            .attr("bgcolor", d => this.complianceColors[d[1]])
            .text(function (d) {
                return d[0];
            });

    }

    private DrawChart(energy: DAG) {
        var width = 960;
        var height = 500;

        // clear
        d3.selectAll("#d3").selectAll("*").remove();

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
}