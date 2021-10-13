import $ from 'jquery';
import * as d3 from 'd3';
import * as main from '..';
import { segmentColors, getCurrentSegmentId, highlightModel } from './listSegments';
import { showCurrentData } from '../ui';

let brushes = [];
var layerTypeData = ['Conv2d','ReLU','Conv2d','ReLU','MaxPool2d',
'Conv2d','ReLU','Conv2d','ReLU','MaxPool2d','Conv2d','ReLU',
'Conv2d','ReLU','Conv2d','ReLU','MaxPool2d','Conv2d','ReLU',
'Conv2d','ReLU','Conv2d','ReLU','MaxPool2d','Conv2d','ReLU',
'Conv2d','ReLU','Conv2d','ReLU','MaxPool2d','AdaptAvgPool2d',
'Linear','ReLU','Dropout','Linear','ReLU','Dropout','Linear'];
let segmentContainer = $('#lrp-segments-chart');

let currentSegmentRow = -1;

/**
 * Draw segments vertically
 * @param {*} divId
 * @param {*} segmentData
 */
export default function(divId, segmentData)
{
    // Reset brushes
    brushes = [];
    let modelContainer = $('#' + divId);
    modelContainer.empty();

    // Dimensions
    let margin = ({top: 35, right: 50, bottom: 10, left: 10 });
    let width = modelContainer.width() - margin.left - margin.right;
    let height = modelContainer.height() - margin.top - margin.bottom;

    // Y scales
    let y = d3.scaleLinear()
        .domain([1, 39])
        .rangeRound([0, height]);

    // Create svg
    let svg = d3.select('#' + modelContainer.attr('id'))
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ','  + margin.top + ')');

    // Draw y axis
    svg.append('g')
        .style('fill', '#fff')
        .attr('transform', 'translate(20,0)')
        .call(d3.axisLeft(y).ticks(39).tickPadding(2))
        .attr('text-anchor', null)
        .selectAll('text')
        .attr('x', -20)
        .attr('y', 0)
        .text(function(d) {
            return d - 1;
        });

    // Draw segment rectangles
    svg.append('g')
        .style('fill',  function(d, i) { return '#fff' })
        .attr('transform', 'translate(30,0)')
        .call(d3.axisLeft(y)
            .ticks(39)
            // Set tick as width of container
            .tickSize(-width + 60)
            .tickFormat(function() {
                return null;
            }))
        .selectAll('.tick')
        .attr('stroke', '#000')
        .attr('stroke-opacity', 0.8);

    // Initialize tree map container
    initializeTreeMap(segmentData);
    // Start making brush
    for (let i = 0; i < segmentData.length; ++i) {
        makeBrush(segmentData[i]);
    }

    function makeBrush(data) {

        const brush = d3.brushY()
            .extent([[0, 0], [width, height]])
            .on('brush', brushMove)
            .on('end', brushEnd);

        // Add brush data
        data['brush'] = brush;
        brushes.push(data);

        // Update brush
        d3.select('.brushes').remove();
        // Create brush group
        let gBrushes = svg.append('g')
            .attr('class', 'brushes')
            .attr('transform', 'translate(30,0)');

        let brushSelection = gBrushes.selectAll('.brush').data(brushes, function(d) {
            return d.id;
        });

        brushSelection.enter()
            .insert('g', '.brush')
            .attr('class', 'brush')
            .attr('id', function(d) { return 'brush-' + d.id; })
            .each(function(brushObject) {
                brushObject.brush(d3.select(this));
                brushObject.brush.move(d3.select(this), [
                    y(brushObject.x0),
                    y(brushObject.x1)
                ]);


                d3.select(this).selectAll('.selection')
                    .style('fill', '#fff')
                    .style('stroke', '#252525')
                    .style('fill-opacity', 0.8);

                // Get selection region
                let selectionRegion = d3.select(this);
                // Add parameter charts
                // initializeTreeMap(brushObject);
                // drawTreeMap(brushObject);
                //drawVerticalBarChart(brushObject);
            });

        d3.selectAll('.overlay')
            .style('pointer-events', 'none');
    }

    // Brush move
    function brushMove() {

        // Get current, prev, and next id
        const currentId = parseInt(d3.select(this).attr('id').split('-')[1]);
        const prevId = currentId - 1;
        const nextId = currentId + 1;

        // D3 selections
        const selection = d3.event.selection;
        if (!d3.event.sourceEvent || !selection) return;
        // Get x0 and x1 of current moving segment
        const [y0, y1] = selection.map(function(d) {
            return Math.round(y.invert(d));
        });

        if (y0 !== brushes[currentId].x0 && y1 !== brushes[currentId].x1) {
            brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                y(brushes[currentId].x0),
                y(brushes[currentId].x1)
            ]);
            return;
        };


        // If previous is existed (change on the left)
        if (brushes[prevId]) {
            // Update current left bar;
            // Update previous right bar
            brushes[prevId].x1 = y0;
            // Fix boundary
            if ((brushes[prevId].x0 + 1) > y0) {
                brushes[currentId].x0 = (parseInt(brushes[prevId].x0) + 1);
                brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                    y(brushes[currentId].x0),
                    y(brushes[currentId].x1)
                ]);
            } else {
                // Update all position
                brushes[currentId].x0 = y0;
                brushes[prevId].brush.move(d3.select('#brush-' + brushes[prevId].id), [
                    y(brushes[prevId].x0),
                    y(brushes[prevId].x1)
                ]);
            }
        }

        // If next is existed (change on the right)
        if (brushes[nextId]) {
            if (y0 < y1) {
                // Bug here!
                //brushes[currentId].x0 = x0;
                brushes[currentId].x1 = y1;
            } else {
                brushes[currentId].x0 = y1 - 1;
                brushes[currentId].x1 = y1;
                brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                    y(brushes[currentId].x0),
                    y(brushes[currentId].x1)
                ]);
            }

            // Update next segments
            if (brushes[nextId].x0  !== y1) {
                // attach next segment
                brushes[nextId].x0 = y1;
                brushes[nextId].brush.move(d3.select('#brush-' + brushes[nextId].id), [
                    y(brushes[nextId].x0),
                    y(brushes[nextId].x1)
                ]);
            }
        }

        // If current is the last move right to the last layer
        if (currentId === brushes.length - 1) {
            // Fix last segments
            brushes[currentId].x1 = y1;
            if (brushes[currentId].x1 !== 39) {
                brushes[currentId].x1 = 39;
                brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                    y(brushes[currentId].x0),
                    y(brushes[currentId].x1)
                ]);
            }
            // Fix boundary of last segments
            if (brushes[currentId].x0 > brushes[currentId].x1 - 1) {
                brushes[currentId].x0 = brushes[currentId].x1 - 1;
                brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                    y(brushes[currentId].x0),
                    y(brushes[currentId].x1)
                ]);
            }
        }

        if (currentId === 0) {
            // Fix boundary for first segment
            brushes[currentId].x0 = y0;
            if (brushes[currentId].x0 !== 1) {
                brushes[currentId].x0 = 1;
                brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                    y(brushes[currentId].x0),
                    y(brushes[currentId].x1)
                ]);
            }
        }

        // Update segment number label
        d3.selectAll('#brush-text-' + brushes[currentId].id).remove();
        /*
        d3.select(this)
                .style('fill-opacity', 1)
                .append('text')
                .attr('class', 'brush-text')
                .attr('id', 'brush-text-' + brushes[currentId].id)
                .attr('x', x(brushes[currentId].x0) + 5)
                .attr('y', 20)
                .text('S.' + (brushes[currentId].id + 1))
                .style('fill', '#000')
                .style('font-size', '14px');*/

        let selectionRegion = d3.select(this);
        // Draw tree map
        //drawTreeMap(selectionRegion, brushes[currentId]);
        // drawTreeMap(brushes[currentId])
        //drawVerticalBarChart(brushes[currentId]);

    }

    // Brush ended
    function brushEnd() {


        // Need to snap the values at the end
        const selection = d3.event.selection;
        if (!d3.event.sourceEvent || !selection) return;

        const [y0, y1] = selection.map(function(d) {
            // This make the snapping happens
            return Math.round(y.invert(d));
        });


        d3.select(this).transition().call(d3.event.target.move, y1 > y0 ? [y0, y1].map(y) : null);

        // Need to update current data
        showCurrentData(brushes);
    }

    // Add reserved layer
    svg.append('g')
    .append('rect')
    .attr('width', width)
    .attr('height', height / 39)
    .attr('x', 30)
    .attr('y', 0)
    .attr('fill', '#fff')
    .style('opacity', 1)
    .style('stroke', '#d9d9d9');

    // Draw segment rectangles
    svg.append('g')
        .attr('transform', 'translate(120,0)')
        .call(d3.axisLeft(y)
            .ticks(39)
            // Set tick as width of container
            .tickSize(0)
            .tickFormat(function(d, i) {
                return layerTypeData[i];
            }))
        .selectAll('.tick')
        .attr('stroke', '#000')
        .attr('opacity', 0.5);

    return;
}

function initializeTreeMap(segments) {
    segmentContainer.empty();
    let segmentHeight = segmentContainer.height() / segments.length;
    for (let i = 0; i < segments.length; ++i) {

        let segmentRow = $('<div/>', {
            id: 'treemap-container-' + i,
            class: 'treemap-containers'
        }).css({
            width: '100%',
            height: segmentHeight,
            'box-sizing': 'border-box',
            background: segmentColors[i],
            'border': '2px solid #fff',
            'cursor': 'pointer'
        })
        segmentContainer.append(segmentRow);

        segmentRow.on('click', function() {

            if (currentSegmentRow !== segments[i].id) {
                $('.treemap-containers').removeClass('active');
                $('.treemap-containers').css({ 'border': '2px solid #fff' });
                $('#lrp-segments-settings').width(0);
            }

            segmentRow.toggleClass('active');

            // Toggle active segments
            if (segmentRow.hasClass('active')) {
                // Show settings
                $('#lrp-segments-settings').width('500px');
                $('#lrp-segments-settings').css({
                    'background-color': segmentColors[i],
                });
                segmentRow.css({ 'border': '2px solid #000' });
                currentSegmentRow = segments[i].id;
                highlightModel(i);

                // Have current segment here

            } else {
                // Hide settings
                $('#lrp-segments-settings').width(0);
                $('.treemap-containers').css({ 'border': '2px solid #fff' });
                currentSegmentRow = -1;
                highlightModel(-1);
            }

        });
        segmentRow.on('mouseover', function() {
            segmentRow.css({ 'border': '2px solid #000' });
        });
        segmentRow.on('mouseout', function() {
            if (currentSegmentRow !== segments[i].id) {
                segmentRow.css({ 'border': '2px solid #fff' });
            }
        });
    }

    return;
}

/*
function drawTreeMap(brush) {

    let parameterStructure = {
        "children": [
        {
            "children": [],
            "colname": "level2",
            "name": "Contribution"
        }, {
            "children": [],
            "colname": "level2",
            "name": "Activation"
        }, {
            "children": [],
            "colname": "level2",
            "name": "Weight"
        }, {
            "children": [],
            "colname": "level2",
            "name": "Suppression"
        }],
        "name": "parameters",
        "colname": "level1"
    }

    var parameters = {
        'theta0': '&#952;0',
        'theta1': '&#952;1',
        'gamma0': '&#947;0',
        'gamma1': '&#947;1',
        'gamma2': '&#947;2',
        'gamma1p': '&#947;1+',
        'gamma1n': '&#947;1-',
        'eps': '&#949;',
        'alpha': '&#945;',
        'beta': '&#946;',
    };

    // Clear current tree map
    // d3.selectAll('.brush-treemap-' + brush.id).remove();

    // Preprocess data
    Object.keys(parameters).forEach(function(parameter) {
        if (brush[parameter] !== 0) {

            let value = brush[parameter];
            let symbol = parameters[parameter];

            let param = {
                colname: "level3",
                symbol: symbol,
                "name": parameter,
                value: value
            };


            switch (parameter) {
                // Contribution
                case 'alpha':
                    parameterStructure.children[0].children.push(param);
                    break;
                case 'beta':
                    parameterStructure.children[0].children.push(param);
                    break;
                // Activation
                case 'theta0':
                    parameterStructure.children[1].children.push(param);
                    break;
                case 'theta1':
                    parameterStructure.children[1].children.push(param);
                    break;
                // Weight
                case 'gamma0':
                    parameterStructure.children[2].children.push(param);
                    break;
                case 'gamma1':
                    parameterStructure.children[2].children.push(param);
                    break;
                case 'gamma2':
                    parameterStructure.children[2].children.push(param);
                    break;
                case 'gamma1p':
                    parameterStructure.children[2].children.push(param);
                    break;
                case 'gamma1n':
                    parameterStructure.children[2].children.push(param);
                    break;
                case 'eps':
                    parameterStructure.children[3].children.push(param);
                    break;
            }
        }
    });

    // Give the data to this cluster layout:
    var root = d3.hierarchy(parameterStructure).sum(function(d){ return d.value});


    //let rect = segmentRegion.node().getBoundingClientRect();
    //let height = rect.height;

    // Divide by number of node
    //let layerWidth = $('#lrp-segments-body').width() / 39;
    // console.log(layerWidth);
    //let segmentWidth = (brush.x1 - brush.x0) * layerWidth;
    let totalLayers = brush.x1 - brush.x0;

    let segmentTreeMap = $('#treemap-container-' + brush.id);

    d3.treemap()
        .size([segmentTreeMap.width(), segmentTreeMap.height()])
        .tile(d3.treemapResquarify)
        .paddingTop(5)
        .paddingBottom(5)
        .paddingLeft(5)
        .paddingRight(5)
        //.paddingInner(2)
        .round(true)
        (root);

    var color = d3.scaleOrdinal()
        .domain(["contribution", "activation", "weight", "suppression"])
        .range(['#8dd3c7','#ffffb3','#bebada','#fb8072']);

    var opacity = d3.scaleLinear()
        .domain([10, 30])
        .range([1,1]);

    //console.log(brush.id);

    d3.select('#selection-treemap-' + brush.id).remove();
    //let moveX = (brush.x0 - 1)// * layerWidth);
    var treemapGroup = d3.select('#' + segmentTreeMap.attr('id'))
                        .append('svg')
                        .attr('id', 'selection-treemap-' + brush.id)
                        .attr('width', segmentTreeMap.width())
                        .attr('height', segmentTreeMap.height());
                        //.attr('id', 'selection-treemap-' + brush.id);
                        //.attr('transform', 'translate(' + moveX  + ',' + 0 + ')');

    treemapGroup
    .selectAll(".treemap-rect")
    .data(root.leaves())
    .enter()
    .append("rect")
        .attr('class', 'treemap-rect')
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        //.transition().duration(500)
        .attr('width', function (d) { return d.x1 - d.x0; })
        .style("stroke", "#000")
        .style('stroke-width', '1px')
        .style("fill", function(d){ return color(d.parent.data.name)} )
        .style('word-wrap', 'break-word')
        .style("opacity", 1)
        .style('cursor', 'pointer');

    treemapGroup
    .selectAll(".treemap-text")
    .data(root.leaves())
    .enter()
    .append("text")
    .attr('class', 'treemap-text')
        .attr("x", function(d){ return d.x0 + 2})    // +10 to adjust position (more right)
        .attr("y", function(d){ return d.y0 + 12})    // +20 to adjust position (lower)
        .html(function(d) {
            return d.data.symbol;

            if (!d.data.children && totalLayers > 6 && d.data.value) {
                return d.data.symbol + " = " + d.data.value;
            } else {
                return d.data.symbol;
            }
        })
        .attr("font-size", "12px")
        .attr("fill", "#252525");
}
*/