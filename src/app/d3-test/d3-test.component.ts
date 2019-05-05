import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';
import { DAG, GraphService } from '../graph.service';

@Component({
  selector: 'app-d3-test',
  templateUrl: './d3-test.component.html',
  styleUrls: [ './d3-test.component.css' ]
})
export class D3TestComponent implements OnInit {    
    constructor(
      private graphService: GraphService) {
    };

    ngOnInit(): void {
       // this.DrawChart();

        
      this.graphService.getGraphData(11, 12, 13)
        .subscribe(gd => { console.log(JSON.stringify(gd)); this.DrawChart(gd); });
    }

    private DrawChart(energy) {

        var svg = d3.select("#sankey"),
            width = +svg.attr("width"),
            height = +svg.attr("height");

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

        //d3.json("./energy.json", function (error, energy: any) {
            //if (error) throw error;

        //const energy: DAG = {
        //    nodes: [{
        //        nodeId: 0,
        //        name: "node0"
        //    }, {
        //        nodeId: 1,
        //        name: "node1"
        //    }, {
        //        nodeId: 2,
        //        name: "node2"
        //    }, {
        //        nodeId: 3,
        //        name: "node3"
        //    }, {
        //        nodeId: 4,
        //        name: "node4"
        //    }],
        //    links: [{
        //        source: 0,
        //        target: 2,
        //        value: 2,
        //        uom: 'Widget(s)'
        //    }, {
        //        source: 1,
        //        target: 2,
        //        value: 8,
        //        uom: 'Widget(s)'
        //    }, {
        //        source: 1,
        //        target: 3,
        //        value: 2,
        //        uom: 'Widget(s)'
        //    }, {
        //        source: 0,
        //        target: 4,
        //        value: 2,
        //        uom: 'Widget(s)'
        //    }, {
        //        source: 0,
        //        target: 3,
        //        value: 2,
        //        uom: 'Widget(s)'
        //    }, {
        //        source: 2,
        //        target: 4,
        //        value: 2,
        //        uom: 'Widget(s)'
        //    }, {
        //        source: 3,
        //        target: 4,
        //        value: 4,
        //        uom: 'Widget(s)'
        //    }]
        //};


            sankey.nodeSort((a, b) => a.title < b.title);
            sankey.nodeId(d => d.nodeId);

            sankey(energy);

            link = link
                .data(energy.links)
                .style("mix-blend-mode", "multiply");

                 //const gradient = link.append("linearGradient")
                 //    .attr("gradientUnits", "userSpaceOnUse")
                 //    //.attr("id", d => d.uid)
                 //    .attr("x1", d => d.source.x1)
                 //    .attr("x2", d => d.target.x0);
                 //
                 //gradient.append("stop")
                 //    .attr("offset", "0%")
                 //    .attr("stop-color", d => color(d.source.name));
                 //
                 //gradient.append("stop")
                 //    .attr("offset", "100%")
                 //      .attr("stop-color", d => color(d.target.name));

                link.enter().append("path")
                .attr("d", d3Sankey.sankeyLinkHorizontal())
                .attr("stroke-width", function (d: any) { return Math.max(1, d.width); })
                .attr("stroke", d => color(d.source.name))
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
                .attr("fill", function (d: any) { return color(d.name.replace(/ .*/, "")); })
                .attr("stroke", "#000")
                .on('click', function(d, i) {
                  console.log("clicked node", d);
                })
                .on("mouseover", function(d) {
                    d3.select(this).style("cursor", "pointer"); 
                  });

            node.append("text")
                .attr("x", function (d: any) { return d.x0 - 6; })
                .attr("y", function (d: any) { return (d.y1 + d.y0) / 2; })
                .attr("dy", "0.35em")
                .attr("text-anchor", "end")
                .text(function (d: any) { return d.name; })
                .filter(function (d: any) { return d.x0 < width / 2; })
                .attr("x", function (d: any) { return d.x1 + 6; })
                .attr("text-anchor", "start");

            node.append("title")
                .text(function (d: any) { return d.name + "\n" + format(d.value); });
        //});
    }
}