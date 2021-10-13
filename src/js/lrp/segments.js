import * as d3 from 'd3';
import $ from 'jquery';

// Layer types and colors
var layerTypes = ['Conv2d', 'ReLU', 'MaxPool2d', 'AdaptiveAvgPool2d', 'Linear', 'Dropout'];
var layerTypeColors = ['#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c'];

var brushes = [];

var layerTypeData = ['Conv2d-1','ReLU-2','Conv2d-3','ReLU-4','MaxPool2d-5',
'Conv2d-6','ReLU-7','Conv2d-8','ReLU-9','MaxPool2d-10','Conv2d-11','ReLU-12',
'Conv2d-13','ReLU-14','Conv2d-15','ReLU-16','MaxPool2d-17','Conv2d-18','ReLU-19',
'Conv2d-20','ReLU-21','Conv2d-22','ReLU-23','MaxPool2d-24','Conv2d-25','ReLU-26',
'Conv2d-27','ReLU-28','Conv2d-29','ReLU-30','MaxPool2d-31','AdaptiveAvgPool2d-32',
'Linear-33','ReLU-34','Dropout-35','Linear-36','ReLU-37','Dropout-38','Linear-39'];
// Do we need to add 'Linear-39'?

export default function(divId, segmentData) {
    // Clear model container
    brushes = [];

    let modelContainer = $('#' + divId);
    modelContainer.empty();

    // Add Layer type legend
    // addLayerTypeLegend(modelContainer);
    // console.log(segmentData);

    // Start drawing models
    var margin = ({top: 5, right: 5, bottom: 5, left: 10});
    var width = modelContainer.width() - margin.left - margin.right;
    var height = modelContainer.height() - margin.top - margin.bottom;

    var x = d3.scaleLinear()
                .domain([1, 39])
                .rangeRound([0, width]);

    var svg = d3.select('#' + modelContainer.attr('id'))
                .append('svg')
                    .attr('width', width + margin.left + margin.right)
                    .attr('height', height + margin.top + margin.bottom)
                .append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Add layer types
    var modelLayerX = d3.scaleLinear()
                        .domain([1, 39])
                        .rangeRound([0, width]);

    var modelLayerGroup = svg.selectAll('.rect')
                            .data(layerTypeData)
                            .enter()
                            .append('g')
                            .classed('rect', true);

    modelLayerGroup.append('rect')
        .attr('width', width / layerTypeData.length)
        .attr('height', 7)
        .attr('x', function(d, i) { return modelLayerX(i + 1); })
        .attr('y', height)
        .attr('fill', function(d) {
            var typePos = layerTypes.indexOf(d.split('-')[0]);
            return layerTypeColors[typePos];
        })
        .attr('stroke', 'none');

    svg.append('g')
        .style('fill', '#fff')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x)
            .ticks(39)
            .tickSize(-height)
            .tickFormat(function() { return null; }))
        .selectAll('.tick')
            .attr('stroke', '#fff')
            .attr('stroke-opacity', '0')

    svg.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x)
            .ticks(39) // Can be number of the segments
            .tickPadding(2))
        .attr('text-anchor', null)
        .selectAll('text')
            .attr('x', -3);

    // Loop and call make data
    for (var i = 0; i < segmentData.length; ++i) {
        makeBrush(segmentData[i]);
    }

    function makeBrush(data) {

        const brush = d3.brushX()
                        .extent([[0, 0], [width, height]])
                        .on('brush', brushMove)
                        .on('end', brushended);

        data['brush'] = brush;
        brushes.push(data);
        // Clear all brushes
        d3.select('.brushes').remove();
        let gBrushes = svg.append('g').attr('class', 'brushes');
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
                x(brushObject.x0),
                x(brushObject.x1)
            ]);

            // Set colors of each segment
            d3.select(this).selectAll('.selection')
                .style('fill', '#fff')
                .style('stroke', '#252525')
                .style('fill-opacity', 1);
            /*
            d3.select(this).append('text')
                .attr('id', 'brush-text-' + brushObject.id)
                .attr('x', x(brushObject.x0) + 5)
                .attr('y', 20)
                .text('S.' + (brushObject.id + 1))
                .style('fill', '#000')
                .style('font-size', '14px');*/

            let selectionRegion = d3.select(this);

            // Draw tree map
            drawTreeMap(selectionRegion, brushObject);
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
        const [x0, x1] = selection.map(function(d) {
            return Math.round(x.invert(d));
        });

        if (x0 !== brushes[currentId].x0 && x1 !== brushes[currentId].x1) {
            brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                x(brushes[currentId].x0),
                x(brushes[currentId].x1)
            ]);
            return;
        };


        // If previous is existed (change on the left)
        if (brushes[prevId]) {
            // Update current left bar;
            // Update previous right bar
            brushes[prevId].x1 = x0;
            // Fix boundary
            if ((brushes[prevId].x0 + 1) > x0) {
                brushes[currentId].x0 = (parseInt(brushes[prevId].x0) + 1);
                brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                    x(brushes[currentId].x0),
                    x(brushes[currentId].x1)
                ]);
            } else {
                // Update all position
                brushes[currentId].x0 = x0;
                brushes[prevId].brush.move(d3.select('#brush-' + brushes[prevId].id), [
                    x(brushes[prevId].x0),
                    x(brushes[prevId].x1)
                ]);
            }
        }

        // If next is existed (change on the right)
        if (brushes[nextId]) {
            if (x0 < x1) {
                // Bug here!
                //brushes[currentId].x0 = x0; 
                brushes[currentId].x1 = x1;
            } else {
                brushes[currentId].x0 = x1 - 1;
                brushes[currentId].x1 = x1;
                brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                    x(brushes[currentId].x0),
                    x(brushes[currentId].x1)
                ]);
            }

            // Update next segments
            if (brushes[nextId].x0  !== x1) {
                // attach next segment
                brushes[nextId].x0 = x1;
                brushes[nextId].brush.move(d3.select('#brush-' + brushes[nextId].id), [
                    x(brushes[nextId].x0),
                    x(brushes[nextId].x1)
                ]);
            }
        }

        // If current is the last move right to the last layer
        if (currentId === brushes.length - 1) {
            // Fix last segments
            brushes[currentId].x1 = x1;
            if (brushes[currentId].x1 !== 39) {
                brushes[currentId].x1 = 39;
                brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                    x(brushes[currentId].x0),
                    x(brushes[currentId].x1)
                ]);
            }
            // Fix boundary of last segments
            if (brushes[currentId].x0 > brushes[currentId].x1 - 1) {
                brushes[currentId].x0 = brushes[currentId].x1 - 1;
                brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                    x(brushes[currentId].x0),
                    x(brushes[currentId].x1)
                ]);
            }
        }

        if (currentId === 0) {
            // Fix boundary for first segment
            brushes[currentId].x0 = x0;
            if (brushes[currentId].x0 !== 1) {
                brushes[currentId].x0 = 1;
                brushes[currentId].brush.move(d3.select('#brush-' + brushes[currentId].id), [
                    x(brushes[currentId].x0),
                    x(brushes[currentId].x1)
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
        drawTreeMap(selectionRegion, brushes[currentId]);
    }

    // Brush ended
    function brushended() {


        // Need to snap the values at the end
        const selection = d3.event.selection;
        if (!d3.event.sourceEvent || !selection) return;

        const [x0, x1] = selection.map(function(d) {
            // This make the snapping happens
            return Math.round(x.invert(d));
        });


        d3.select(this).transition().call(d3.event.target.move, x1 > x0 ? [x0, x1].map(x) : null);
    }

    return;
}

function addLayerTypeLegend(container) {

    // Create layer legend
    var layerTypeLegend = d3.select('#' + container.attr('id'))
                            .append('div')
                            .style('position', 'absolute')
                            .style('top', '5px')
                            .style('left', '5px')
                            .style('width', 'auto')
                            .style('height', 'auto');

    // Add layer type legend
    for (var i = 0; i < layerTypes.length; ++i) {
        layerTypeLegend.append('div')
            .style('width', '150px')
            .style('height', 'auto')
            .style('color', layerTypeColors[i])
            .style('font-size', '14px')
            .html('<i class="fas fa-square-full"></i> ' + '<font color="#000">' +  layerTypes[i] + '</font>');
    }

    return;
}

function drawTreeMap(segmentRegion, brush) {

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
        'gamma1p': '&#947;1p',
        'gamma1n': '&#947;1n',
        'eps': '&#949;',
        'alpha': '&#945;',
        'beta': '&#946;',
    };
    
    // Clear current tree map
    d3.selectAll('.brush-treemap-' + brush.id).remove();

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


    let rect = segmentRegion.node().getBoundingClientRect();
    let height = rect.height;

    // Divide by number of node
    let layerWidth = $('#lrp-segments-body').width() / 39;
    // console.log(layerWidth);
    let segmentWidth = (brush.x1 - brush.x0) * layerWidth;
    let totalLayers = brush.x1 - brush.x0;

    d3.treemap()
        .size([segmentWidth, height])
        .tile(d3.treemapResquarify)
        .paddingTop(10)
        .paddingBottom(10)
        .paddingLeft(10)
        .paddingRight(0)
        //.paddingInner(2)
        .round(true)
        (root);

    var color = d3.scaleOrdinal()
        .domain(["contribution", "activation", "weight", "suppression"])
        .range(['#fbb4ae','#b3cde3','#ccebc5','#decbe4']);

    var opacity = d3.scaleLinear()
        .domain([10, 30])
        .range([1,1]);

    d3.select('#selection-treemap-' + brush.id).remove();
    let moveX = ((brush.x0 - 1) * layerWidth);
    var treemapGroup = segmentRegion.append('g')
                        .attr('id', 'selection-treemap-' + brush.id)
                        .attr('transform', 'translate(' + moveX  + ',' + 0 + ')');

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
        .style("stroke", "#fff")
        .style('stroke-width', '2px')
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
            if (!d.data.children && totalLayers > 6 && d.data.value) {
                return d.data.symbol + " = " + d.data.value; 
            } else {
                return d.data.symbol;
            }
        })
        .attr("font-size", "12px")
        .attr("fill", "#252525");

    /*
    treemapGroup
    .selectAll(".treemap-titles")
    .data(root.descendants().filter(function(d){return d.depth==1}))
    .enter()
    .append("text")
        .attr('class', 'treemap-titles')
        .attr("x", function(d){ return d.x0 + 5})
        .attr("y", function(d){ return d.y0 + 15})
        .text(function(d){
            if (d.data.children.length > 0 && totalLayers > 6) {
                return d.data.name;
            }
        })
        .attr("font-size", "14px")
        .attr("fill",  '#252525' function(d){ return color(d.data.name)})
    */
}