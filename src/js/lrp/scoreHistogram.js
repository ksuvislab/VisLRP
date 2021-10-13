import $ from 'jquery';
import * as d3 from 'd3';
import * as lrp from '.';
import * as util from '../utils';

let colorIndex = 0;
let scoreColor = ['#e41a1c','#377eb8','#4daf4a','#984ea3'];
let histogramContainer = $('#lrp-intermediate-histogram');
let histogramControl = $('#lrp-intermediate-histogram-controls');
let legendContainer = $('#lrp-intermediate-legend');

/**
 * 
 * @param {*} layerIndex number of layer
 * @param {*} scoreType 'activation_sum', 'relevance_sum_positive', 'relevance_sum negative', 'relevance_sum_absolute', 'relevance_sum_combination'
 */
export default function(layerIndex, scoreType, data) 
{
    // Reset color index
    colorIndex = 0;
    // Initialize selection tabs as legends
    createSelectionLegends(layerIndex, data);
    drawHistogram(layerIndex, scoreType, data);

    return;
}

/**
 * Create selection legends
 * @param {*} layerIndex layer index
 */
function createSelectionLegends(layerIndex, data) 
{
    // Clear legend container
    legendContainer.empty();

    // Score types
    let scoreTypeTexts = ['Activation Sum', 'Relevance +', 'Relevance -'];
    let scoreTypes = ['activation_sum', 'relevance_sum_positive', 'relevance_sum_negative'];

    for (let i = 0; i < scoreTypes.length; ++i) {

        // Create legend rows
        let legendRow = $('<div/>', {
            class: 'score-legend'
        }).css({
            width: '100%',
            height: '40px',
            'line-height': '40px',
            'box-sizing': 'border-box',
            'margin-top': '2px',
            'color': scoreColor[i],
            'border': '1px solid #d9d9d9',
            'text-align': 'left',
            'padding': '5px',
            'cursor': 'pointer',
            'background-color': (i === 0) ? '#bedaf7' : '#fff'
        }).html('<i class="fas fa-square"></i>  ' + scoreTypeTexts[i]);

        legendContainer.append(legendRow);
        
        legendRow.on('click', function() {
            // Reset background color
            $('.score-legend').css({ 'background-color': '#fff' });
            // Highlight active background color 
            legendRow.css({ 'background-color': '#bedaf7' });
            // Recall draw histogram
            colorIndex = i;
            drawHistogram(layerIndex, scoreTypes[i], data);
        });
    }

    return;
}

/**
 * Draw historgram
 */
function drawHistogram(layerIndex, scoreType, data) 
{   
    // Clear container and control
    histogramContainer.empty();
    histogramControl.empty();

    let layerData = data.filter(obj => {
        return obj.layer === layerIndex;
    });

    // Global histogram data
    let histogramData = [];
    let isBrushed = false;
    let focusData = [];
    let histogramRange = [];

    Object.keys(layerData[0].data).forEach(function(item) {

        // Compute sums
        let sum = parseFloat(layerData[0].data[item][scoreType].toFixed(2));

        // Add histogram data
        histogramData.push({
            'type': scoreType,
            'id': item,
            'value': sum,
            'data': layerData[0].data[item]
        });

        // Add histogram range
        histogramRange.push(sum);
    });

    // Default bin value
    let binNumbers = 25;
    // Create bin slider
    // Bin label
    let binSliderLabel = $('<label/>').css({
        'font-size': '14px',
        'width': '40%',
        'height': '100%',
        'line-height': '20px',
        'float': 'left'
    }).html('Number of Bins: ' + binNumbers);

    // Bin slider
    let binSlider = $('<input/>', {
        type: 'range',
        class: 'custom-slider',
        min: 1,
        max: 50,
        value: binNumbers,
        step: 1
    }).css({ float: 'left', width: '55%', 'margin-top': '10px'});

    histogramControl.append(binSliderLabel);
    histogramControl.append(binSlider);

    // Draw histogram
    let margin = {top: 10, right: 30, bottom: 30, left: 40};
    let width = histogramContainer.width() - margin.left - margin.right;
    let height = histogramContainer.height() - margin.top - margin.bottom - 80;
    let height2 = 40

    let svg = d3.select('#' + histogramContainer.attr('id'))
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', (height + 80) + margin.top + margin.bottom);

    let focus = svg.append('g')
        .attr('class', 'focus')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let context = svg.append('g')
        .attr('class', 'context')
        .attr("transform", "translate(" + margin.left + "," + (margin.top + height + 20) + ")");

    let min = d3.min(histogramRange);
    let max = d3.max(histogramRange);

    // X axis
    let x0 = d3.scaleLinear()
        .domain([min, max])
        .range([0, width]);

    let x = d3.scaleLinear()
        .domain([min, max])
        .range([0, width]);

    focus.append("g")
        .attr('class', 'focus-xaxis')
        .attr("transform", "translate(0," + height + ")");

    context.append("g")
        .attr('class', 'context-xaxis')
        .attr("transform", "translate(0," + height2 + ")")
        .call(d3.axisBottom(x).ticks(6).tickFormat(d3.format('.1s')));

    // Y axis
    
    var y = d3.scaleLinear()
        .range([height2, 0]);

    var yFocus = d3.scaleLinear()
        .range([height, 0]);

    var yAxis = focus.append("g");

    // Create brush
    let brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on('brush', brushed);

    context.append("g")
        .attr('class', 'brush')
        .call(brush)
        .call(brush.move, x.range());

    function updateHistogram(bin) {

        let histogram = d3.histogram()
        .value(function(d) { return +d.value; })
        .domain(x.domain())
        .thresholds(x.ticks(bin));

        var bins1 = histogram(histogramData.filter( function(d){return d.type === scoreType} ));

        // Calculate max number of each bin
        let maxBin = [];
        maxBin.push(d3.max(bins1, function(d) { return d.length; }));

        
        y.domain([0, d3.max(maxBin)]);
        /*
        yAxis.transition()
            .duration(1000)
            .call(d3.axisLeft(y));*/

        var rect1 = context.selectAll('.rect1').data(bins1);

        rect1.enter()
            .append("rect")
            //.on('click', clickHistogram)
            .on('mouseover', function() { d3.select(this).style('stroke','#000'); })
            .on('mouseout', function() { d3.select(this).style('stroke','none'); })
            .merge(rect1)
            .attr("class", "rect1")
            .transition()
            .duration(1000)
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
            .attr("width", function(d) { return Math.abs(x(d.x1) - x(d.x0) - 1 ) ; })
            .attr("height", function(d) { return height2 - y(d.length); })
            .style("fill", scoreColor[colorIndex])
            .style("opacity", 0.5);
            //.style('cursor', 'pointer');

        rect1.exit().remove();
    }

    function updateBigHistogram() {

        // Update x axis
        d3.select('.focus-xaxis')
            .transition().duration(1000)
            .call(d3.axisBottom(x0).ticks(6).tickFormat(d3.format('.3s')));

        let drawData = (isBrushed) ? focusData : histogramData;
        //console.log(drawData);

        let histogram = d3.histogram()
            .value(function(d) { return +d.value; })
            .domain(x0.domain())
            .thresholds(x0.ticks(6));

        var bins1 = histogram(drawData.filter( function(d){return d.type === scoreType} ));

        // Calculate max number of each bin
        let maxBin = [];
        maxBin.push(d3.max(bins1, function(d) { return d.length; }));
        
        yFocus.domain([0, d3.max(maxBin)]);
        yAxis.transition()
            .duration(1000)
            .call(d3.axisLeft(yFocus));

        
        var rect1 = focus.selectAll('.focus-rect1').data(bins1);

        rect1.enter()
            .append("rect")
            //.on('click', clickHistogram)
            .on('mouseover', function() { d3.select(this).style('stroke','#000'); })
            .on('mouseout', function() { d3.select(this).style('stroke','none'); })
            .merge(rect1)
            .attr("class", "focus-rect1")
            .transition()
            .duration(1000)
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x0(d.x0) + "," + yFocus(d.length) + ")"; })
            .attr("width", function(d) { return Math.abs(x0(d.x1) - x0(d.x0) - 1 ) ; })
            .attr("height", function(d) { return height - yFocus(d.length); })
            .style("fill", scoreColor[colorIndex])
            .style("opacity", 0.5);
            //.style('cursor', 'pointer');

        rect1.exit().remove();

        // Highlight nodes

    
        d3.selectAll('.node-rect')
            .style('opacity', 0.2);

        for (let i = 0; i < drawData.length; ++i) {
            d3.select('#node-' + layerIndex + '-' + drawData[i]['id'])
                .style('opacity', 1);
        }
        
    }

    function brushed() {
        var s = d3.event.selection || x.range()
        x0.domain(s.map(x.invert, x));

        let xRange = s.map(x.invert, x);

        focusData = histogramData.filter(function(d) {
            return d.value >= xRange[0] && d.value <= xRange[1];
        });

        updateBigHistogram();
        isBrushed = true;
    }

    /*
    function clickHistogram(d) {

        // Reset filter node data
        let filterNodeData = {};
        for (let i = 0; i < d.length; ++i) {
            filterNodeData[d[i].id] = d[i].data;
        }

        lrp.drawNodeSquare(layerIndex, data, filterNodeData);
    }*/

    // Update histogram
    updateHistogram(binNumbers);
    updateBigHistogram();
    yAxis.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("fill", "#252525")
        .text("# Nodes")

    // Bin slider event
    binSlider.off().on('input', function() {
        let binValue = binSlider.val();
        binSliderLabel.html('Number of Bins: ' + binValue);
        updateHistogram(binValue);
        updateBigHistogram();
    });

    // Add reset button
    /*
    let resetButton = $('<button/>').css({
        position: 'absolute',
        top: '5px',
        right: '5px',
        width: '30px',
        height: '30px',
        'outline': 'none', 'border': 'none',
        'font-family': 'Lato', 'font-size': '20px',
        'background': '#d9d9d9', 'cursor': 'pointer',
        'z-index': 1000
    }).html('<i class="fas fa-sync-alt"></i>');
    histogramContainer.append(resetButton);

    resetButton.off().on('click', function() {
        lrp.drawNodeSquare(layerIndex, data, undefined);
    });*/
    return;
}



