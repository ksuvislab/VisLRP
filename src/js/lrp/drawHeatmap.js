import $ from 'jquery';
import * as d3 from 'd3';
import * as main from '..';
import flipNode from './flipNode';

let nodeList = {};

export default function(nodeData, nodeIndex, layerIndex) {

    if (layerIndex in nodeList) {
        nodeList[layerIndex].push(parseInt(nodeIndex));
    } else {
        nodeList[layerIndex] = [];
        nodeList[layerIndex].push(parseInt(nodeIndex));
    }

    let activationHeatmap = $('#lrp-heatmap-activation');
    let relevanceHeatmap = $('#lrp-heatmap-relevancepos');

    activationHeatmap.empty();
    relevanceHeatmap.empty();

    activationHeatmap.css({'background-image': 'url("' + main.getInputImagePath() + '")'});
    relevanceHeatmap.css({'background-image': 'url("' + main.getInputImagePath() + '")'});

    let activationHeatmapData = nodeData['activation_heatmap'];
    let relevanceHeatmapData = nodeData['relevance_heatmap'];
    let activationHeatmapValues = [];
    let relevanceHeatmapValues = [];
    for (let i = 0; i < activationHeatmapData.length; ++i) {
        for (let j = 0; j < activationHeatmapData[i].length; ++j) {
            activationHeatmapValues.push(activationHeatmapData[i][j]);
            relevanceHeatmapValues.push(relevanceHeatmapData[i][j]);
        }
    }

    let rowGroup = activationHeatmapData.length;
    let widthGroup = activationHeatmapData[0].length;

    let squareWidth = activationHeatmap.width() / widthGroup;
    let squareHeight = activationHeatmap.height() / rowGroup;

    var svg1 = d3.select('#' + activationHeatmap.attr('id'))
                .append('svg')
                .attr('width', activationHeatmap.width())
                .attr('height', activationHeatmap.height());

    var svg2 = d3.select('#' + relevanceHeatmap.attr('id'))
                .append('svg')
                .attr('width', relevanceHeatmap.width())
                .attr('height', relevanceHeatmap.height());

    var actColor = d3.scaleSequential(d3.interpolateReds)
    .domain([d3.min(activationHeatmapValues), d3.max(activationHeatmapValues)]);

    var releColor = d3.scaleSequential(d3.interpolateBlues)
    .domain([d3.min(relevanceHeatmapValues), d3.max(relevanceHeatmapValues)]);

    for (var i = 0; i < activationHeatmapData.length; ++i) {
        for (var j = 0; j < activationHeatmapData[i].length; ++j) {
            svg1.append('rect')
                .attr('x', i * squareWidth)
                .attr('y', j * squareHeight)
                .attr('width', squareWidth)
                .attr('height', squareHeight)
                .style('opacity', 0.7)
                .style('stroke-width', '0px')
                .style('stroke', '#fff')
                .style('fill', actColor(activationHeatmapData[i][j]));

            svg2.append('rect')
                .attr('x', i * squareWidth)
                .attr('y', j * squareHeight)
                .attr('width', squareWidth)
                .attr('height', squareHeight)
                .style('opacity', 0.7)
                .style('stroke-width', '0px')
                .style('stroke', '#fff')
                .style('fill', releColor(relevanceHeatmapData[i][j]));
        }
    }

    $('#lrp-flip-button').off().on('click', function() {
        flipNode(nodeList);
    });

    // Add draw

    var activeLine;
    var renderPath = d3.line()
        .x(function(d) { return d[0]; })
        .y(function(d) { return d[1]; })
        .curve(d3.curveBasis);

    svg1.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    function dragstarted() {
        activeLine = svg1.append("path").datum([])
            .style('stroke-width', '20px')
            .style('fill', 'none')
            .style('stroke', 'yellow')
            .style('opacity', '0.5');

        activeLine.datum().push(d3.mouse(this));
    }

    function dragged() {
        activeLine.datum().push(d3.mouse(this));
        activeLine.attr("d", renderPath);
    }

    function dragended() {
        activeLine = null;
    }
}