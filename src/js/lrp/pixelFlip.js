import $ from 'jquery';
import * as d3 from 'd3';
import path from 'path';
import fs from 'fs';
import * as util from '../utils';

import { getInputImagePath, getOriginalPrediction } from '..';
import { getPrediction, drawBarChart, ablatePredict } from '.';
import { byHeatmapImage } from '../ablate';
import xmlserializer from 'xmlserializer';
import { set_top_selection } from './horizontalBarChart';

var flippingContents = $('#lrp-flipping-contents');
var flippingList = $('#lrp-flipping-list');
var addButton = $('#lrp-flipping-add');
var currentIndex = 0;
let prediction_result = {};

export default function()
{
    // Clear all contents
    flippingContents.empty();
    flippingList.empty();


    // Add compare
    currentIndex = 0;
    prediction_result = {};

    // Initialize first container
    createContainer(currentIndex);

    // Add Flipping comparison
    addButton.off().on('click', function() {
        createContainer(++currentIndex);
    });

    return;
}

function createContainer(index)
{
    var container = $('<div/>', {
        id: 'flipping-' + index,
        class: 'flipping-panel'
    }).css({
        position: 'relative',
        width: '100%',
        height: '320px',
        'box-sizing': 'border-box',
        'border-bottom': '1px solid #fff',
        'display': 'inline-block',
        'cursor': 'pointer',
        'float': 'left'
    });

    var listContainer = $('<div/>').css({
        position: 'relative',
        width: '100px',
        height: '30px',
        'line-height': '30px',
        'box-sizing': 'border-box',
        'border-right': '1px solid #1666ba',
        'display': 'inline-block',
        'text-align': 'center'
    }).html('Panel: ' + parseInt(index + 1));

    // Add 2 button
    /*
    var heatmapBtn = $('<button/>', { class: 'flipping-heatmap-button active' }).html('Flipping By Heatmap');

    var brushBtn = $('<button/>', { class: 'flipping-brush-button' }).html('Flipping By Brush');

    container.append(heatmapBtn);
    container.append(brushBtn);*/

    flippingContents.append(container);
    flippingList.append(listContainer);

    //add_flipping_modes(container, index);
    drawInputImage(container, index);
    drawOutputImage(container, index);
    drawPrediction(container, index);
    addBrush(index);

    //
    let title = $('<div/>').css({
        position: 'absolute',
        width: '100%',
        height: '30px',
        'z-index': '1000',
        top: '0',
        left: '0',
        'text-align': 'center',
        'font-size': '12px'
    }).html('Brush on Heatmap or Image for Noise Flipping');

    container.append(title);

    /*
    drawInputImage(container, index);
    drawPrediction(container, index);
    drawOutputImage(container, index);
    addBrush(index);
    addThresholdInput(container, index);*/

    /*addThresholdInput(container, index);*/

    /*
    brushBtn.on('click', function() {
        heatmapBtn.removeClass('active');
        brushBtn.addClass('active');
        $('#threshold-input-' + index).remove();
        addBrush(index);
    });

    heatmapBtn.on('click', function() {
        heatmapBtn.addClass('active');
        brushBtn.removeClass('active');
        addThresholdInput(container, index);
    });*/

    /*
    container.on('click', function() {
        set_top_selection(index);
        if (prediction_result[index]) {
            drawBarChart('flipping-prediction-'+index, prediction_result[index], false);
        } else {
            drawBarChart('flipping-prediction-'+index, getOriginalPrediction(), false);
        }
    });*/

    return;
}

/*
function add_flipping_modes(container, index)
{
    let button_container = $('<div/>').css({
        width: '200px',
        height: '100%',
        'box-sizing': 'border-box',
        'border-right': '1px solid #fff',
        'float': 'left',
        'padding': '5px',
    });

    let noise_flipping_button = $('<div/>').css({
        'width': '100%',
        'height': 'auto',
        'font-size': '14px',
        'margin-top': '50px',
        'background-color': '#1666ba',
        'color': '#fff',
        'border': '1px solid #000',
        'text-align': 'center',
        'box-sizing': 'border-box',
        'padding': '5px',
        'cursor': 'pointer'
    }).html('Brush Image <br/> for Noise Flipping');

    let relevance_flipping_button = $('<div/>').css({
        'width': '100%',
        'height': 'auto',
        'font-size': '14px',
        'margin-top': '2px',
        'background-color': '#fff',
        'color': '#000',
        'border': '1px solid #000',
        'text-align': 'center',
        'box-sizing': 'border-box',
        'padding': '5px',
        'cursor': 'pointer'
    }).html('Select Relevance Scores <br/> for Noise Flipping');

    button_container.append(noise_flipping_button);
    button_container.append(relevance_flipping_button);
    container.append(button_container);

    let brush_reset_button = $('<div/>').css({
        'width': '100%',
        'height': 'auto',
        'font-size': '14px',
        'margin-top': '2px',
        'background-color': '#bedaf7',
        'color': '#000',
        'border': '1px solid #000',
        'text-align': 'center',
        'box-sizing': 'border-box',
        'padding': '5px',
        'cursor': 'pointer'
    }).html('<i class="fas fa-sync-alt"></i> Reset Brush');
    brush_reset_button.insertAfter(noise_flipping_button);

    noise_flipping_button.on('click', function(e) {
        e.stopPropagation();
        relevance_flipping_button.css({
            'background-color': '#fff',
            'color': '#000',
        });
        noise_flipping_button.css({
            'background-color': '#1666ba',
            'color': '#fff',
        });

        // Add reset button
        brush_reset_button.show();
        $('#threshold-input-' + index).remove();
        addBrush(index);
    });

    relevance_flipping_button.on('click', function(e) {
        e.stopPropagation();
        // Add input
        noise_flipping_button.css({
            'background-color': '#fff',
            'color': '#000',
        });
        relevance_flipping_button.css({
            'background-color': '#1666ba',
            'color': '#fff',
        });

        brush_reset_button.hide();
        drawOutputImage(container, index);
        drawInputImage(container, index);
        drawPrediction(container, index);
        // Add threshold
        add_threshold_input(relevance_flipping_button, index);
    });

    brush_reset_button.on('click', function(e) {
        // Reset draw
        drawInputImage(container, index);
        drawOutputImage(container, index);
        drawPrediction(container, index);
        addBrush(index);
    });

    return;
}*/

function drawInputImage(container, index)
{
    $('#input-flipping-container-' + index).remove();

    var inputPath = getInputImagePath();

    var inputImgContainer = $('<div/>', {
        id: 'input-flipping-container-' + index
    }).css({
        width: '300px',
        height: '100%',
        'padding': '10px',
        'box-sizing': 'border-box',
        'float': 'left'
    });

    var brushTitle = $('<div/>').css({
        width: '100%',
        height: '30px',
        'line-height': '30px',
        'box-sizing': 'border-box',
        'text-align': 'center',
        'font-size': '14px',
    }).html('Input Image');

    var inputImage = $('<div/>', {
        id: "flipping-input-" + index
    }).css({
        position: 'relative',
        width: '280px',
        height: '280px',
        'box-sizing': 'border-box',
    });

    container.append(inputImgContainer);
    inputImgContainer.append(brushTitle);
    inputImgContainer.append(inputImage);

    var backendImage = $('<div/>', {
        id: "flipping-backend-" + index
    }).css({
        position: 'absolute',
        width: '280px',
        height: '280px',
        'box-sizing': 'border-box',
        'display': 'none'
    });

    inputImage.append(backendImage);

    d3.select('#' + backendImage.attr('id'))
        .append('svg')
        .attr('id', 'flipping-backend-svg-' + index)
        .attr('width', inputImage.width())
        .attr('height', inputImage.height());

    // Draw images
    var svg = d3.select('#' + inputImage.attr('id'))
        .append('svg')
        .attr('id', 'flipping-input-svg-' + index)
        .attr('width', inputImage.width())
        .attr('height', inputImage.height());

    var defs= svg.append('defs')

    defs.append('pattern')
        .attr('id', 'inputPic')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', inputImage.width())
        .attr('height', inputImage.height())
        .append('svg:image')
            .attr('xlink:href', inputPath + '?' + (new Date().getTime()))
            .attr('width', inputImage.width())
            .attr('height', inputImage.height())
            .attr('x', 0)
            .attr('y', 0);

    svg.append("rect")
        .attr('width', inputImage.width())
        .attr('height', inputImage.height())
        .attr('x', 0)
        .attr('y', 0)
        .attr("fill", "url(#inputPic)");

    return;
}

function drawPrediction(container, index)
{
    $('#flipping-prediction-' + index).remove();

    var predictionContainer = $('<div/>', {
        id: 'flipping-prediction-' + index
    }).css({
        width: 'calc(100% - 700px)',
        height: '100%',
        'box-sizing': 'border-box',
        'padding': '5px',
        'float': 'left',
        'position': 'relative'
    });

    container.append(predictionContainer);

    // Get prediction result and draw it
    /*
    drawBarChart(predictionContainer.attr('id'), getOriginalPrediction(), false);*/

    return;
}

function add_prediction_title(container)
{
    // Add prediction title
    let prediction_title = $('<div/>').css({
        width: '100%',
        height: '30px',
        'line-height': '30px',
        'box-sizing': 'border-box',
        'text-align': 'center',
        'font-size': '14px',
        'top': '10px',
        'left': '0px',
        'position': 'absolute'
    }).html('Prediction Classes after Noise Flipping');

    container.append(prediction_title);
    return;
}

function drawOutputImage(container, index)
{
    $('#output-flipping-container-' + index).remove();
    var outputImgContainer = $('<div/>', {
        id: 'output-flipping-container-' + index
    }).css({
        width: '320px',
        height: '100%',
        'padding': '10px',
        'box-sizing': 'border-box',
        'float': 'left'
    });

    var outputTitle = $('<div/>').css({
        width: '100%',
        height: '30px',
        'line-height': '30px',
        'box-sizing': 'border-box',
        'text-align': 'center',
        'font-size': '14px',
    }).html('Relevance Heatmap');

    var outputImage = $('<div/>', {
        id: "flipping-output-" + index
    }).css({
        width: '280px',
        height: '280px',
        'box-sizing': 'border-box',
    });

    outputImgContainer.append(outputTitle);
    outputImgContainer.append(outputImage);
    container.append(outputImgContainer);

    // Draw images
    var svg = d3.select('#' + outputImage.attr('id'))
        .append('svg')
        .attr('id', 'flipping-output-svg-' + index)
        .attr('width', outputImage.width())
        .attr('height', outputImage.height());

    var defs= svg.append('defs')

    defs.append('pattern')
        .attr('id', 'outputPic')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', outputImage.width())
        .attr('height', outputImage.height())
        .append('svg:image')
            .attr('xlink:href', path.join(__dirname, '..', '..', '..','output.png') + '?' + (new Date().getTime()))
            .attr('width', outputImage.width())
            .attr('height', outputImage.height())
            .attr('x', 0)
            .attr('y', 0);

    svg.append("rect")
        .attr('width', outputImage.width())
        .attr('height', outputImage.height())
        .attr('x', 0)
        .attr('y', 0)
        .attr("fill", "url(#outputPic)");

    return;
}

/*
function addThresholdInput(container, index) {

    var titleContainer = $('<div/>', {
        id: 'threshold-input-' + index,
    }).css({
        'position': 'absolute',
        'top': '600px',
        'left': '0px',
        'width': '100%',
        'height': '20px',
        'line-height': '20px',
        'text-align': 'center',
        'font-size': '14px',
        'box-sizing': 'border-box'
    }).html('Highlight important pixels by relevance scores');

    var inputContainer = $('<div/>', {
        id: 'threshold-input-' + index,
    }).css({
        'position': 'absolute',
        'top': '620px',
        'left': '0px',
        'width': '100%',
        'height': '40px',
        //'border': '1px solid #000',
        'box-sizing': 'border-box',
        'padding': '5px'
    });

    container.append(inputContainer);
    container.append(titleContainer);


    let base = get_base_number(0);

    let upper_bound = (1 - base);
    let lower_bound = (0 - base);
    let step = 0.01;

    console.log([upper_bound, lower_bound]);
    let layerId = 0;

    util.readPickle(path.join(__dirname, '..', '..', '..', 'intermediate_data', 'intermediate_data_dict_' +  layerId + '.pickle')).then(function(result) {

        var pixels = [];
        // Draw histogram here
        Object.keys(result).forEach(function(pixel) {
            pixels.push(parseFloat(result[pixel]));
        });

        let min = d3.min(pixels);
        let max = d3.max(pixels);

        let width = inputContainer.width();
        let height = inputContainer.height();
        let bin_number = 50;

        let x = d3.scaleLinear()
            .domain([min, max])
            .range([0, width]);

        let histogram = d3.histogram()
            .value(function(d) { return d; })
            .domain(x.domain())
            .thresholds(x.ticks(bin_number));

        let bins = histogram(pixels);

        var y = d3.scaleLinear()
            .range([height, 0]);
            y.domain([0, d3.max(bins, function(d) { return d.length; })]);

        let svg = d3.select('#' + inputContainer.attr('id'))
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        let colorScale = d3.scaleLinear()
            .domain([min, max])
            .range(['#d9d9d9', '#b2182b'])
            .interpolate(d3.interpolateHcl);

        if (min < 0) {
            colorScale = d3.scaleLinear()
            .domain([min, (min + max) / 2, max])
            .range(['#2166ac', '#d9d9d9', '#b2182b'])
            .interpolate(d3.interpolateHcl);
        } else if (max < 0) {
            colorScale = d3.scaleLinear()
            .domain([min, max])
            .range(['#2166ac', '#d9d9d9'])
            .interpolate(d3.interpolateHcl);
        }

        let step = Math.abs((min + max) / bin_number);

        let threshold = [];
        for (let i = min; i <= max; i += step) {
            threshold.push(i);
        }

        svg.selectAll('.gradient-threshold-rect')
            .append('g')
            .data(threshold)
            .enter()
            .append('rect')
            .attr('x', function(d, i) { return x(d) })
            .attr('y', '0')
            .attr('width', width / threshold.length)
            .attr('height', height)
            .style('fill', function(d) { return colorScale(d)});

        // lower_bound label
        svg.append('text')
            .attr('x', 2)
            .attr('y', 16)
            .style('font-size', '12px')
            .style('font-family', 'sans-serif')
            .attr('text-anchor', 'start')
            .style('fill', '#000')
            .text(min.toFixed(2));

        // lower_bound label
        svg.append('text')
            .attr('x', width - 2)
            .attr('y', 16)
            .style('font-size', '12px')
            .style('font-family', 'sans-serif')
            .attr('text-anchor', 'end')
            .style('fill', '#000')
            .text(max.toFixed(2));

        svg.append("g")
            .attr("class", "brush")
            .call(d3.brushX()
                .extent([[0, 0], [width, height]])
                .on('brush', brushMove)
                .on("end", brushended));

        svg.selectAll(".pixel-histogram")
        .append('g')
        .data(bins)
        .enter()
        .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
            .attr("width", function(d) { return x(d.x1) - x(d.x0) -1 ; })
            .attr("height", function(d) { return height - y(d.length); })
            .style('fill', '#000');

        function brushMove() {
            // Need to snap the values at the end
            const selection = d3.event.selection;
            if (!d3.event.sourceEvent || !selection) return;

            const [x0, x1] = selection.map(function(d) {
                // This make the snapping happens
                return x.invert(d);
                //return Math.round(x.invert(d));
            });

            d3.select('.threshold-ranges-text-' + index).remove();
            d3.select('.threshold-ranges-text2-' + index).remove();

            svg.append('text')
                .attr('class', 'threshold-ranges-text-' + index)
                .attr('x', x(x0) - 2)
                .attr('y', height / 2)
                .style('font-size', '12px')
                .style('font-family', 'sans-serif')
                .attr('text-anchor', 'end')
                .style('fill', '#fff')
                .text(x0.toFixed(2));

            svg.append('text')
                .attr('class', 'threshold-ranges-text2-' + index)
                .attr('x', x(x1) + 2)
                .attr('y', height / 2)
                .style('font-size', '12px')
                .style('font-family', 'sans-serif')
                .attr('text-anchor', 'start')
                .style('fill', '#fff')
                .text(x1.toFixed(2));
        }

        function brushended() {

            // Need to snap the values at the end
            const selection = d3.event.selection;
            if (!d3.event.sourceEvent || !selection) return;

            const [x0, x1] = selection.map(function(d) {
                // This make the snapping happens
                return x.invert(d);
                //return Math.round(x.invert(d));
            });

            updateHeatmapPrediction([x0, x1], index);

            d3.select(this).transition().call(d3.event.target.move, x1 > x0 ? [x0, x1].map(x) : null);
        }
    });


    return;
}*/

function updateHeatmapPrediction(threshold, index)
{

    let inputImage = $('#flipping-input-' + index);
    let outputImage = $('#flipping-output-' + index);

    byHeatmapImage(0, [threshold[0], threshold[1]]).then(function(result) {

        //console.log(result);
        let rawImagePath = getInputImagePath();
        let outputImagePath = path.join(__dirname, '..', '..', '..','output.png') + '?' + (new Date().getTime());

        inputImage.empty();
        outputImage.empty();

        // Draw images
        var svg = d3.select('#' + inputImage.attr('id'))
            .append('svg')
            .attr('id', 'flipping-input-svg-' + index)
            .attr('width', inputImage.width())
            .attr('height', inputImage.height());

        var svg2 = d3.select('#' + outputImage.attr('id'))
            .append('svg')
            .attr('id', 'flipping-output-svg-' + index)
            .attr('width', outputImage.width())
            .attr('height', outputImage.height());

        addBrush(index);


        var bg = svg.append('defs');
        var bg2 = svg2.append('defs');

        bg.append('pattern')
            .attr('id', 'flip-bg-' + index)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', inputImage.width())
            .attr('height', inputImage.height())
            .append('svg:image')
                .attr('xlink:href', rawImagePath + '?' + (new Date().getTime()))
                .attr('width', inputImage.width())
                .attr('height', inputImage.height())
                .attr('x', 0)
                .attr('y', 0);

        bg2.append('pattern')
        .attr('id', 'flip-bg2-' + index)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', outputImage.width())
        .attr('height', outputImage.height())
        .append('svg:image')
            .attr('xlink:href', outputImagePath)
            .attr('width', outputImage.width())
            .attr('height', outputImage.height())
            .attr('x', 0)
            .attr('y', 0);

        var overlay = svg.append('defs');
        var overlay2 = svg.append('defs');

        overlay.append('pattern')
            .attr('id', 'flip-overlay-' + index)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', inputImage.width())
            .attr('height', inputImage.height())
            .append('svg:image')
                .attr('xlink:href', path.join(__dirname, '..', '..', '..', 'images_ablated','output_ablated_frontend.png') + '?' + (new Date().getTime()))
                .attr('width', inputImage.width())
                .attr('height', inputImage.height())
                .attr('x', 0)
                .attr('y', 0);

        overlay2.append('pattern')
        .attr('id', 'flip-overlay2-' + index)
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', outputImage.width())
        .attr('height', outputImage.height())
        .append('svg:image')
            .attr('xlink:href', path.join(__dirname, '..', '..', '..', 'images_ablated','output_ablated_frontend.png') + '?' + (new Date().getTime()))
            .attr('width', outputImage.width())
            .attr('height', outputImage.height())
            .attr('x', 0)
            .attr('y', 0);

        svg.append("rect")
            .attr('width', inputImage.width())
            .attr('height', inputImage.height())
            .attr('x', 0)
            .attr('y', 0)
            .attr("fill", "url(#flip-bg-" + index + ")");

        svg.append("rect")
            .attr('width', inputImage.width())
            .attr('height', inputImage.height())
            .attr('x', 0)
            .attr('y', 0)
            .attr("fill", "url(#flip-overlay-" + index + ")");

        svg2.append("rect")
            .attr('width', outputImage.width())
            .attr('height', outputImage.height())
            .attr('x', 0)
            .attr('y', 0)
            .attr("fill", "url(#flip-bg2-" + index + ")");

        svg2.append("rect")
            .attr('width', outputImage.width())
            .attr('height', outputImage.height())
            .attr('x', 0)
            .attr('y', 0)
            .attr("fill", "url(#flip-overlay2-" + index + ")");

        ablatePredict().then(function(result) {
            prediction_result[index] = result;
            drawBarChart('flipping-prediction-' + index, result, false);
            //add_prediction_title($('#flipping-prediction-'+index));
            add_prediction_title($('#flipping-prediction-'+index));
        });

    });

    return;
}

function addBrush(index)
{
    var inputSvg = d3.select('#flipping-input-svg-' + index);
    var backend_svg = d3.select('#flipping-backend-svg-' + index);
    var outputSvg = d3.select('#flipping-output-svg-' + index);

    var activeLine, activeLine2,activeLine3;
    var renderPath = d3.line()
        .x(function(d) { return d[0]; })
        .y(function(d) { return d[1] })
        .curve(d3.curveCatmullRom);

    var renderPath2 = d3.line()
        .x(function(d) { return d[0]; })
        .y(function(d) { return d[1] })
        .curve(d3.curveCatmullRom);

    var renderPath3 = d3.line()
        .x(function(d) { return d[0]; })
        .y(function(d) { return d[1] })
        .curve(d3.curveCatmullRom);

    inputSvg.call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    backend_svg.call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    outputSvg.call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    function dragstarted() {
        activeLine = inputSvg.append('path').datum([])
            .style('stroke-width', '20px')
            .style('fill', 'none')
            .style('stroke', 'yellow')
            .style('opacity', '0.5');

        activeLine2 = outputSvg.append('path').datum([])
            .style('stroke-width', '20px')
            .style('fill', 'none')
            .style('stroke', 'yellow')
            .style('opacity', '0.5');

        activeLine3 = backend_svg.append('path').datum([])
            .style('stroke-width', '20px')
            .style('fill', 'none')
            .style('stroke', 'black')
            .style('opacity', '1');

        activeLine.datum().push(d3.mouse(this));
        activeLine2.datum().push(d3.mouse(this));
        activeLine3.datum().push(d3.mouse(this));
    }

    function dragged() {
        activeLine.datum().push(d3.mouse(this));
        activeLine.attr('d', renderPath);
        activeLine2.datum().push(d3.mouse(this));
        activeLine2.attr('d', renderPath2);
        activeLine3.datum().push(d3.mouse(this));
        activeLine3.attr('d', renderPath3);
    }

    function dragended() {
        activeLine = null;
        activeLine2 = null;
        activeLine3 = null;

        // Update prediction by export masked images
        getDownLoadURL(backend_svg, index);
    }


    return;
}

function getDownLoadURL(svg, index)
{
    let serializedSVG = xmlserializer.serializeToString(svg.node());
    //console.log(serializedSVG);
    let base64Data = window.btoa(serializedSVG);
    let svgData = 'data:image/svg+xml;base64,' + base64Data;

    var canvas = document.createElement('canvas');
    let width = $('#flipping-input-' + index).width();
    let height = $('#flipping-input-' + index).height();

    // get canvas context for drawing on canvas
    var context = canvas.getContext('2d');
    // set canvas size
    canvas.width = width;
    canvas.height = height;

    // create image in memory(not in DOM)
    var background = new Image();
    // later when image loads run this
    background.onload = function () { // async (happens later)

        // clear canvas
        context.clearRect(0, 0, width, height);
        // draw image with SVG data to canvas
        context.drawImage(background, 0, 0, width, height);

        var image = new Image();
        image.onload = function () {

            context.drawImage(image, 0, 0, width, height);
            // snapshot canvas as png
            var pngData = canvas.toDataURL('image/' + 'png');
            var data = pngData.replace(/^data:image\/\w+;base64,/, "");
            var buf = new Buffer(data, 'base64');
            fs.writeFile('masked_image.png', buf, function(err) {
                if (err) throw err;
                console.log('Image Saved!');
                let maskedImgPath = path.join(__dirname, '..', '..', '..','masked_image.png');

                getPrediction(maskedImgPath).then(function(result) {
                    prediction_result[index] = result;
                    drawBarChart('flipping-prediction-'+index, result, false);
                    // Add title
                    //add_prediction_title($('#flipping-prediction-'+index));
                    add_prediction_title($('#flipping-prediction-'+index));
                });
            });
        }
        image.src = svgData;
    };

    background.src = getInputImagePath();

    return;
}

// Get base number of layerId
/*
function get_base_number(layerId)
{
    let files = fs.readdirSync(path.join(__dirname, '..', '..', '..', 'intermediate_images'));

    for (let i = 0; i < files.length; ++i) {
        let parts = files[i].split('_');
        let layer_id = parseInt(parts[2]);
        if (layer_id === layerId) {
            if (parts[3] === 'grey') {

                // Remove .png
                let base_number = parts[4].split('.')[0];

                // Identify negative or positive
                if (base_number.charAt(0) === '0') {
                    return parseFloat(parseInt(base_number)/100);
                } else {
                    return parseFloat(parseInt(base_number)/100) * -1;
                }
            }
        }
    }
}*/

function add_threshold_input(container, index)
{
    $('#threshold-input-' + index).remove();

    var inputContainer = $('<div/>', {
        id: 'threshold-input-' + index,
    }).css({
        'width': '100%',
        'height': '50px',
        'box-sizing': 'border-box',
        'padding': '5px'
    });

    inputContainer.insertAfter(container);

    let margin = { top: 0, right: 0, bottom: 0, left: 0 };
    let width = inputContainer.width() - margin.left + margin.right;
    let height = inputContainer.height() - margin.top - margin.bottom;

    let svg = d3.select('#' + inputContainer.attr('id')).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.append('rect')
        .attr('x', 0)
        .attr('y', 20)
        .attr('width', width)
        .attr('height', 3)
        .style('fill', '#7ab3ef');


    let layerId = 0;
    util.readPickle(path.join(__dirname, '..', '..', '..', 'intermediate_data', 'intermediate_data_dict_' +  layerId + '.pickle')).then(function(result) {

        var pixels = [];
        // Draw histogram here
        Object.keys(result).forEach(function(pixel) {
            pixels.push(parseFloat(result[pixel]));
        });

        let min = d3.min(pixels);
        let max = d3.max(pixels);

        let x = d3.scaleLinear()
            .domain([min, max])
            .range([0, width]);

        svg.append('text')
            .attr('x', 4)
            .attr('y', 14)
            .style('font-size', '12px')
            .style('font-family', 'sans-serif')
            .attr('text-anchor', 'start')
            .style('fill', '#000')
            .text(0);

        svg.append('text')
            .attr('x', width - 4)
            .attr('y', 14)
            .style('font-size', '12px')
            .style('font-family', 'sans-serif')
            .attr('text-anchor', 'end')
            .style('fill', '#000')
            .text(1);

        let brush = d3.brushX()
            .extent([[0,0], [width, 30]])
            .on('brush', brushMove)
            .on("end", brushended);

        let handle_x0 = svg.append('circle')
            .attr('cx', 0)
            .attr('cy', 22)
            .attr('r', 6)
            .style('fill', '#1666ba');

        let handle_x1 = svg.append('circle')
            .attr('cx', width)
            .attr('cy', 22)
            .attr('r', 6)
            .style('fill', '#1666ba');

        let value_text = svg.append('text')
            .attr('x', width / 2)
            .attr('y', 40)
            .style('font-size', '12px')
            .style('font-family', 'sans-serif')
            .attr('text-anchor', 'middle')
            .style('fill', '#000')
            .text('Score: 0.00 to 1.00');

        svg.append("g")
                .attr("class", "threshold-brush")
                .call(brush)
                .call(brush.move, [0, width]);

        function brushMove() {
            // Need to snap the values at the end
            const selection = d3.event.selection;
            if (!d3.event.sourceEvent || !selection) return;

            const [x0, x1] = selection.map(function(d) {
                // This make the snapping happens
                return x.invert(d);
                //return Math.round(x.invert(d));
            });

            handle_x0.attr('cx', x(x0));
            handle_x1.attr('cx', x(x1));

            // Update labels
            let norm_x0 =  util.normalize(x0, [min, max], [0, 1]);
            let norm_x1 =   util.normalize(x1, [min, max], [0, 1]);

            value_text.text('Score: ' + norm_x0.toFixed(2) + ' to ' + norm_x1.toFixed(2));
        }

        function brushended() {

            // Need to snap the values at the end
            const selection = d3.event.selection;
            if (!d3.event.sourceEvent || !selection) return;

            const [x0, x1] = selection.map(function(d) {
                // This make the snapping happens
                return x.invert(d);
                //return Math.round(x.invert(d));
            });

            updateHeatmapPrediction([x0, x1], index);

            d3.select(this).transition().call(d3.event.target.move, x1 > x0 ? [x0, x1].map(x) : null);
        }
    });

    return;
}