import $ from 'jquery';
import * as main from '..';
import * as lrp from '.';
import path from 'path';
import fs from 'fs';
import * as d3 from 'd3';
import * as util from '../utils';

let intermediateMode = "relevance";
let intermediateData = undefined;
let entropyData = undefined;
let intermediateDirectory = path.join(__dirname, '..', '..', '..', 'intermediate_scores');
let entropyDataPath = path.join(__dirname, '..', '..', '..', 'entropy_scores', 'entropy_scores.json');

let intermediateButton = $('#lrp-result-layer-btn');
let intermediateContainer = $('#views-lrp-intermediate');
let settingContainer = $('#views-lrp-segments');

let entropyContainer = $('#lrp-intermediate-entropy');
let scoreColor = ['#e41a1c','#377eb8','#4daf4a','#984ea3'];

export default function() {

    // Get entropy data
    getEntropyData().then(function(entropy) {
        entropyData = entropy;
        // Get intermediate scores
        getIntermediateLayerData().then(function(intermediateScores) {
            intermediateData = intermediateScores;
            intermediateButton.off().on('click', function() {
                if (settingContainer.is(':visible')) {
                    // Hide setting container
                    settingContainer.hide();
                    intermediateContainer.show();
                    updateIntermediateLayers();
                    // Update images
                    //updateHeatmapImages();
                }
            });
        });
    });
}

// Get entropy data
function getEntropyData() {
    return new Promise(function(resolve, reject) {
        fs.readFile(entropyDataPath, function(error, data) {
            if (error) reject(error);
            resolve(JSON.parse(data));
        });
    });
}

// Get intermediate data
function getIntermediateLayerData() {

    let intermediateData = [];

    return new Promise(function(resolve, reject) {
        fs.readdir(intermediateDirectory, function(err, items) {
            if (err) reject(err);

            let promiseLoop = [];

            for (let i = 0; i < items.length; ++i) {
                promiseLoop.push(addJsonData(items[i], intermediateData));
            }

            Promise.all(promiseLoop).then(function() {
                resolve(intermediateData);
            });
        });
    });
}

// Add json data to each file
function addJsonData(filename, intermediateData) {
    return new Promise(function(resolve, reject) {

        let parts = filename.split('_');
        let layerIndex = parseInt(parts[parts.length - 1].split('.')[0]);

        let jsonFilePath = path.join(intermediateDirectory, filename);
        fs.readFile(jsonFilePath, function(err, data) {

            if (err) reject(err);
            intermediateData.push({
                layer: layerIndex,
                data: JSON.parse(data)
            });

            resolve();
        });
        
    });
}

export function updateIntermediateLayers() {

    // Retrieve all segment information
    let lrpData = main.getLrpCurrentData();
    if (main.getLrpCurrentSaveData()) {
        lrpData = main.getLrpCurrentSaveData();
    }

    let segmentId = lrp.getCurrentSegmentId();
    let segmentData = lrpData[segmentId];
    let startLayer = segmentData.x0;
    let endLayer = segmentData.x1;

    let filteredData = [];
    let scores = [];
    for (let i = 0; i < intermediateData.length; ++i) {

        let layerData = intermediateData[i];

        if (layerData.layer >= (startLayer - 1) && layerData.layer <= (endLayer - 1)) {
            filteredData.push(layerData);
        }

        Object.keys(layerData.data).forEach(function(node) {
            if (intermediateMode === 'relevance') {
                scores.push(layerData.data[node]['relevance_sum_positive']);
            } else {
                scores.push(layerData.data[node]['activation_sum']);
            }
        });
    }

    // Find min and max scores
    let min = d3.min(scores);
    let max = d3.max(scores);

    drawEntropy(entropyData);
    return;
}

// TODO: need to add filter
function drawEntropy(data) {

    // Preprocess data
    let preprocessData = [];
    let globalData = [];
    Object.keys(data).forEach(function(layer) {

        let parts = layer.split('_');
        let layerIndex = parts[parts.length - 1];
        data[layer].layer = parseInt(layerIndex);

        preprocessData.push(data[layer]);
        globalData.push(data[layer]['activation_entropy']);
        globalData.push(data[layer]['relevance_entropy_positive']);
        globalData.push(data[layer]['relevance_entropy_negative']);
        //globalData.push(data[layer]['relevance_entropy_combination']);
    });

    // Create entropy data structure
    var entropy = [{
        name: 'Activation',
        values: []
    }, {
        name: 'Relevance +',
        values: []
    }, {
        name: 'Relevance -',
        values: []
    }, /*{
        name: 'Relevance +,-',
        values: []
    }*/];
    
    // Sort by layer index
    preprocessData.sort((a, b) => (a.layer > b.layer) ? 1 : -1);

    // Add both activation and relevance score
    for (let i = 0; i < preprocessData.length; ++i) {
        entropy[0].values.push({
            index: preprocessData[i].layer,
            score: preprocessData[i]['activation_entropy']
        });
        entropy[1].values.push({
            index: preprocessData[i].layer,
            score: preprocessData[i]['relevance_entropy_positive']
        });
        entropy[2].values.push({
            index: preprocessData[i].layer,
            score: preprocessData[i]['relevance_entropy_negative']
        });
        /*
        entropy[3].values.push({
            index: preprocessData[i].layer,
            score: preprocessData[i]['relevance_entropy_combination']
        });*/
    }

    entropyContainer.empty();

    var margin = { top: 20, right: 80, bottom: 30, left: 40},
    width = entropyContainer.width() - margin.left - margin.right,
    height = entropyContainer.height() - margin.top - margin.bottom;

    var x = d3.scaleLinear()
            .domain([0, 38])
            .range([0, width]);

    var y = d3.scaleLinear()
            .domain([d3.min(globalData), d3.max(globalData)])
            .range([height, 0]);

    var xAxis = d3.axisBottom().scale(x).ticks(16);

    var yAxis = d3.axisLeft().scale(y);


    var line = d3.line()
                .x(function(d) {
                    return x(d.index);
                })
                .y(function(d) {
                    return y(d.score);
                })
                .curve(d3.curveBasis);

    var svg = d3.select('#' + entropyContainer.attr('id'))
                .append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                .attr('class', 'entropy-chart')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .attr("font-size", "12px")
        .attr("fill", "#252525")
        .text("Entropy Scores");

    var entropyScores = svg.selectAll(".entropy-scores")
        .data(entropy)
        .enter().append("g")
        .attr("class", "entropy-scores");

    entropyScores.append("path")
        .attr("class", "line")
        .attr("d", function(d) {
            return line(d.values);
        })
        .style("stroke", function(d, i) {
            return scoreColor[i];
        });

    entropyScores.append("text")
        .datum(function(d) {
            return {
                name: d.name,
                value: d.values[d.values.length - 1]
            };
        })
        .transition().duration(1000)
        .attr("transform", function(d) {
            return "translate(" + x(d.value.index) + "," + y(d.value.score) + ")";
        })
        .attr("x", 3)
        .attr("dy", ".35em")
        .attr("font-size", "12px")
        .attr("fill", function(d, i) {
            return scoreColor[i];
        })
        .text(function(d) {
            return d.name;
        });

    // Selection
    var mouseG = svg.append("g")
        .attr("class", "mouse-over-effects")

    mouseG.append("path") // this is the black vertical line to follow mouse
        .attr("class", "mouse-line")
        .style("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", "0")
        .append("text")
        .attr("transform", "translate(10,3)");;

    var lines = document.getElementsByClassName('line');
    var mousePerLine = mouseG.selectAll('.mouse-per-line')
        .data(entropy)
        .enter()
        .append("g")
        .attr("class", "mouse-per-line");

    mousePerLine.append("circle")
        .attr("r", 7)
        .style("stroke", function(d, i) {
          return scoreColor[i];
        })
        .style("fill", "none")
        .style("stroke-width", "1px")
        .style("opacity", "0");
    
    mousePerLine.append("text")
        .attr("transform", "translate(10,3)");

    // Append a rect to catch mouse movements on canvas
    mouseG.append('svg:rect')
        .attr('width', width) // can't catch mouse events on a g element
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')

        .on('click', function() {
            var mouse = d3.mouse(this)
            var xIndex = Math.round(x.invert(mouse[0]));
            //drawIntermediateScore(xIndex);
            //drawIntermediateScores(xIndex);

            lrp.drawScoreHistogram(xIndex,'activation_sum', intermediateData);
            lrp.drawNodeSquare(xIndex, intermediateData, undefined);
            //drawHistogram(xIndex);
            //drawIntermediateScores(xIndex);
        })

        .on('mouseout', function() { // on mouse out hide line, circles and text
          d3.select(".mouse-line")
            .style("opacity", "0");
          d3.selectAll(".mouse-per-line circle")
            .style("opacity", "0");
          d3.selectAll(".mouse-per-line text")
            .style("opacity", "0");
        })

        .on('mouseover', function() { // on mouse in show line, circles and text
            d3.select(".mouse-line")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line circle")
                .style("opacity", "1");
            d3.selectAll(".mouse-per-line text")
                .style("opacity", "1");

            d3.select('.entropy-chart').style('cursor', 'pointer');
        })

        .on('mousemove', function() { // mouse moving over canvas
            var mouse = d3.mouse(this)
            d3.select(".mouse-line")
                .attr("d", function() {
                    var d = "M" + mouse[0] + "," + height;
                    d += " " + mouse[0] + "," + 0;
                    return d;
                });
  
            d3.selectAll(".mouse-per-line")
                .attr("transform", function(d, i) {

                    //console.log(width/mouse[0])
                    var xIndex = x.invert(mouse[0]),
                        bisect = d3.bisector(function(d) { return d.index; }).right,
                        idx = bisect(d.values, xIndex);
              
                    var beginning = 0,
                        end = lines[i].getTotalLength(),
                        target = null,
                        pos = null;
        
                    while (true){
                        target = Math.floor((beginning + end) / 2);
                        pos = lines[i].getPointAtLength(target);
                        if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                            break;
                        }
                        if (pos.x > mouse[0])      end = target;
                        else if (pos.x < mouse[0]) beginning = target;
                        else break; //position found
                    }
                    
                    d3.select(this).select('text')
                        .attr('font-size', '12px')
                        .text(y.invert(pos.y).toFixed(2));
                return "translate(" + mouse[0] + "," + pos.y +")";
            });
    });
}

/*
function showHeatmap(nodeData) {

    let activationHeatmap = $('#lrp-intermediate-heatmap-activation');
    let relevanceHeatmap = $('#lrp-intermediate-heatmap-relevance');

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
}

function drawIntermediateScore(layerIndex) {

    var layerData = intermediateData.filter(obj => {
        return obj.layer === layerIndex
    });

    scoreContainer.empty();

    let squareDim = 40;

    let allActivationSum = [];
    let allRelevanceSum = [];
    Object.keys(layerData[0].data).forEach(function(item) {
        allActivationSum.push(layerData[0].data[item]['activation_sum']);
        allRelevanceSum.push(layerData[0].data[item]['relevance_sum_positive']);
    });

    var activationColor = d3.scaleSequential(d3.interpolateReds)
        .domain([d3.min(allActivationSum), d3.max(allActivationSum)]);

    console.log(d3.min(allRelevanceSum) + '-' + d3.max(allRelevanceSum));
    
    var relevanceColor = d3.scaleSequential(d3.interpolateBlues)
        .domain([d3.min(allRelevanceSum), d3.max(allRelevanceSum)]);


    let index = 0;
    Object.keys(layerData[0].data).forEach(function(item) {
        let nodeData = layerData[0].data[item];
        
        var rect = $('<div/>', {
            id: 'node-' + index
        }).css({
            'box-sizing': 'border-box',
            'width': squareDim,
            'height': squareDim,
            'float': 'left',
            'margin': '5px',
            'background-color': '#fff',
            'cursor': 'pointer'
        });

        rect.hover(function() {
            rect.css({'border': '1px solid #000' });
        }, function() {
            rect.css({'border': 'none' });
        });

        scoreContainer.append(rect);

        var svg = d3.select('#' + rect.attr('id')).append('svg')
                    .attr('width', squareDim)
                    .attr('height', squareDim);

        // Activation
        svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .transition().delay(100)
            .attr('width', squareDim)
            .attr('height', squareDim / 2)
            .style('fill', activationColor(nodeData['activation_sum']));

        // Relevance
        svg.append('rect')
            .attr('x', 0)
            .attr('y', squareDim / 2)
            .transition().delay(100)
            .attr('width', squareDim)
            .attr('height', squareDim / 2)
            .style('fill', relevanceColor(nodeData['relevance_sum_positive']));

        let activationHeatmapValues = [];
        let relevanceHeatmapValues = [];
        let activationHeatmapData = nodeData['activation_heatmap'];
        let relevanceHeatmapData = nodeData['relevance_heatmap'];

        for (let i = 0; i < activationHeatmapData.length; ++i) {
            for (let j = 0; j < activationHeatmapData[i].length; ++j) {
                activationHeatmapValues.push(activationHeatmapData[i][j]);
                relevanceHeatmapValues.push(relevanceHeatmapData[i][j]);
            }
        }

        rect.on('mouseover', function() {

            var activationHeatmap = $('<div/>', {
                class: 'activation-heatmap'
            }).css({
                position: 'absolute',
                'top': 0,
                'left': 0,
                'width': '50%',
                'height': '100%',
                //'background-color': '#fff',
                'background-image': 'url("' + main.getInputImagePath() + '")',
                'opacity': 1
            });

            var relevanceHeatmap = $('<div/>', {
                class: 'relevance-heatmap'
            }).css({
                position: 'absolute',
                'top': 0,
                'right': 0,
                'width': '50%',
                'height': '100%',
                //'background-color': '#fff',
                'background-image': 'url("' + main.getInputImagePath() + '")',
                'opacity': 1
            });

            entropyContainer.append(activationHeatmap);
            entropyContainer.append(relevanceHeatmap);

            let rowGroup = activationHeatmapData.length;
            let widthGroup = activationHeatmapData[0].length;

            let squareWidth = activationHeatmap.width() / widthGroup;
            let squareHeight = activationHeatmap.height() / rowGroup;

            var svg1 = d3.select('.activation-heatmap')
                        .append('svg')
                        .attr('width', activationHeatmap.width())
                        .attr('height', activationHeatmap.height());

            var svg2 = d3.select('.relevance-heatmap')
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
        });

        rect.on('mouseout', function() {
            d3.selectAll('.activation-heatmap').remove();
            d3.selectAll('.relevance-heatmap').remove();
        });

        ++index;
    });
}*/