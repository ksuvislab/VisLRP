import * as d3 from 'd3';
import $ from 'jquery';
import { segmentColors } from '../../lrp/listSegments';
import heatmap from './heatmap';
import distribution from './distribution';
import { add_layer, remove_layer } from './nodelist';

let selectedLayer = [];
let container = $('#ablate-deviation-body');

var layerTypeData = ['Conv2d','ReLU','Conv2d','ReLU','MaxPool2d',
'Conv2d','ReLU','Conv2d','ReLU','MaxPool2d','Conv2d','ReLU',
'Conv2d','ReLU','Conv2d','ReLU','MaxPool2d','Conv2d','ReLU',
'Conv2d','ReLU','Conv2d','ReLU','MaxPool2d','Conv2d','ReLU',
'Conv2d','ReLU','Conv2d','ReLU','MaxPool2d','AdaptAvgPool2d',
'Linear','ReLU','Dropout','Linear','ReLU','Dropout','Linear'];

export default function(data, segment_data)
{
    // Clear layer selection
    selectedLayer = [];
    container.empty();
    let node_data = preprocess_data(data, segment_data);

    //node_data.shift();
    //console.log(node_data);

    // Add ruler
    let ruler_container = $('<div/>').css({
        height: '100%',
        width: '100',
        'box-sizing': 'border-box',
        'float': 'left',
        'border': '1px solid #f0f0f0'
    });

    container.append(ruler_container);

    let ruler_title = $('<div/>').css({
        height: '20px',
        'line-height': '20px',
        width: '100%',
        'font-size': '14px',
        'box-sizing': 'border-box',
        'float': 'left',
        'background': '#252525',
        'color': '#fff',
        'border': '1px solid #f0f0f0',
        'text-align': 'center'
    }).html('Segments Ruler');

    let ruler_body = $('<div/>', { id: 'ablate-ruler'}).css({
        height: 'calc(100% - 20px)',
        width: '100%',
        position: 'relative',
        'box-sizing': 'border-box',
        'float': 'left',
        'border': '1px solid #f0f0f0'
    });

    ruler_container.append(ruler_title);
    ruler_container.append(ruler_body);

    let margin = {top: 5, bottom: 5, left: 2,right: 2};
    let width = ruler_body.width() - margin.left - margin.right;
    let height  = ruler_body.height() - margin.top - margin.bottom;

    let yScale = d3.scaleBand().domain(node_data.map(function(d, i) {
        return i;
    })).range([0, height]).padding(0.05);

    let svg = d3.select('#' + ruler_body.attr('id'))
        .append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let segment = svg.selectAll('.ruler')
        .data(node_data)
        .enter().append('g')
        .attr('class', function(d, i) {
            return 'ruler'
        })
        .attr('id', function(d, i) {
            return 'ruler-' + i
        })
        .style('cursor', 'pointer')
        .on('click', function(d, i) {

            // Selection
            let layer = d3.select('.ruler-rect-' + i);

            // Draw heatmap
            if (layer.classed('select')) {
                layer.classed('select', false);
                //console.log('not select');
                layer.attr('opacity', 0.3);
                selectedLayer.splice(selectedLayer.indexOf(i), 1);
                console.log(selectedLayer);
                remove_layer(i);
                //Redrae
                heatmap(data, selectedLayer);
                distribution(data, selectedLayer[0]);

            } else {
                layer.classed('select', true);
                //console.log('select');
                layer.attr('opacity', 1);
                selectedLayer.push(i);
                console.log(selectedLayer);
                // i = layer id
                add_layer(i);
                // Redraw
                heatmap(data, selectedLayer);
                distribution(data, selectedLayer[0]);
                // May draw gallery hree
            }

        });;

    /*
    segment.append('g')
        .attr('stroke', 'none')
        .attr('fill', 'none')
        .call(d3.axisRight(yScale).tickFormat(function(d,i) { return  (i) + ' ' + layerTypeData[i]; }));*/

    segment.append('rect')
        .attr('class', function(d, i) {
            return 'ruler-rect-' + i
        })
        .attr('x', 0 )
        .attr('y', function(d, i) {
            return yScale(i);
        })
        .attr('opacity', 0.3)
        .attr('width', 100)
        .attr('height', yScale.bandwidth())
        .attr('fill', function(d, i) {
            for (var k  = 0; k <  segment_data.length; ++k) {
                let segment = segment_data[k];
                if ((i + 1) >= segment.x0 && (i + 1) <= segment.x1) {
                    return segmentColors[k];
                }
            }
        })

    segment.append('text')
        .attr('x', 2)
        .attr('y', function(d, i) {
            return yScale(i) + 10;
        })
        .attr('text-anchor', 'start')
        .attr('font-size', '10px')
        .text(function(d,i) { return  (i) + ' ' + layerTypeData[i]; });




    // draw_relevance(node_data, 'positive', data);
    //draw_relevance(node_data, 'negative', data);
    return;
}

function draw_relevance(node_data, score_type, alldata)
{
    let minData = [];
    let maxData = [];
    let meanData = [];
    for (let i = 0; i < node_data.length; ++i) {

        if (score_type === 'positive') {
            minData.push(node_data[i]['relevance_positive_range'][0]);
            maxData.push(node_data[i]['relevance_positive_range'][1]);
            meanData.push(node_data[i]['relevance_mean_positive']);
        } else {
            minData.push(node_data[i]['relevance_negative_range'][0]);
            maxData.push(node_data[i]['relevance_negative_range'][1]);
            meanData.push(node_data[i]['relevance_mean_negative']);
        }
    }

    let score_container = $('<div/>').css({
        height: '100%',
        width: 'calc(100% - 110px)',
        'box-sizing': 'border-box',
        'float': 'left',
        'border': '1px solid #f0f0f0'
    });

    let score_title = $('<div/>').css({
        height: '20px',
        'line-height': '20px',
        width: '100%',
        'font-size': '14px',
        'box-sizing': 'border-box',
        'float': 'left',
        'background': '#bedaf7',
        'border': '1px solid #f0f0f0',
        'text-align': 'center'
    }).html((score_type === 'positive') ? 'Segments' : 'Negative Relevance of Layers');

    let score_body = $('<div/>', { id: 'relevance-chart-' + score_type }).css({
        height: 'calc(100% - 20px)',
        width: '100%',
        position: 'relative',
        'box-sizing': 'border-box',
        'float': 'left',
        'border': '1px solid #f0f0f0'
    });

    container.append(score_container);
    score_container.append(score_title);
    score_container.append(score_body);

    let chart_label = ['Min', 'Mean', 'Max'];
    let chart_type = ['min', 'mean', 'max'];
    let chart_score = [minData, meanData, maxData];

    let chart_types = chart_type[0];
    let chart_data = chart_score[0];
    let margin = {top: 30, bottom: 0, left: 0,right: 0};
    let width = score_body.width() - margin.left - margin.right;
    let height  = score_body.height() - margin.top - margin.bottom;

    let yScale = d3.scaleBand().domain(node_data.map(function(d, i) {
        return i;
    })).range([0, height]).padding(0.1);

    let xScale = d3.scaleLinear()
        .domain([d3.min(chart_data), d3.max(chart_data)])
        .range([0, width]);

    let svg = d3.select('#' + score_body.attr('id'))
        .append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let bar = svg.selectAll('.bar-' + score_type + '-' + chart_type[0]).data(chart_data)
        .enter().append('g')
        .attr('class', function(d, i) {
            return 'bar-' + score_type + '-' + chart_types + ' bar-layer-' + i
        })
        .style('cursor', 'pointer')
        .on('mouseover', function(d, i) {
            let x = d3.event.pageX - document.getElementById(score_body.attr('id')).getBoundingClientRect().x;
            tooltip.transition()
                .duration(200)
                .style('opacity', .9);
            tooltip.html('Layer' + (i+1) + ' = ' + d.toFixed(2))
                .style('width', 'auto')
                .style('left', x + 'px')
                .style('top', (yScale(i) + 25) + 'px');
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        })
        .on('click', function(d, i) {

            // Selection
            let layer = d3.selectAll('.bar-layer-' + i);

            // Draw heatmap
            if (layer.classed('select')) {
                layer.classed('select', false);
                //console.log('not select');
                layer.attr('stroke', 'none');
                selectedLayer.splice(selectedLayer.indexOf(i), 1);
                console.log(selectedLayer);
                remove_layer(i);
                //Redrae
                heatmap(alldata, selectedLayer);
                distribution(alldata, selectedLayer[0]);

            } else {
                layer.classed('select', true);
                //console.log('select');
                layer.attr('stroke', '#252525').attr('stroke-width', 2);
                selectedLayer.push(i);
                console.log(selectedLayer);
                // i = layer id
                add_layer(i);
                // Redraw
                heatmap(alldata, selectedLayer);
                distribution(alldata, selectedLayer[0]);
                // May draw gallery hree
            }

        });

    bar.append('rect')
        .attr('class', score_type + '-' + chart_type[0] + '-bg')
        .attr('x', 0 )
        .attr('y', function(d, i) {
            return yScale(i);
        })
        .attr('width', width)
        .attr('height', yScale.bandwidth())
        .attr('fill', '#f0f0f0');

    /*
    for (let i = 0; i < chart_type.length; ++i) {

        // Add tooltip
        let tooltip = d3.select('#' + score_body.attr('id')).append('div')
            .attr('class', 'lrp-analysis-tooltip')
            .style('z-index', 1000)
            .style('opacity', 0);

        let chart_data = chart_score[i];

        let margin = {top: 30, bottom: 5, left: 20,right: 15};
        let width = (score_body.width() / 3) - margin.left - margin.right;
        let height  = score_body.height() - margin.top - margin.bottom;;

        let yScale = d3.scaleBand().domain(node_data.map(function(d, i) {
            return i;
        })).range([0, height]).padding(0.1);

        let xScale = d3.scaleLinear()
            .domain([d3.min(chart_data), d3.max(chart_data)])
            .range([0, width]);

        //(score_type === 'positive') ? (d3.max(chart_data) - d3.min(chart_data)) / 2 : -((d3.max(chart_data) - d3.min(chart_data)) / 2)

        let xAxis = d3.axisTop(xScale)
            .tickSize(2)
            .tickValues([d3.min(chart_data) , d3.max(chart_data)]);

        let svg = d3.select('#' + score_body.attr('id'))
            .append('svg')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let chart_types = chart_type[i];

        let bar = svg.selectAll('.bar-' + score_type + '-' + chart_type[i])
            .data(chart_data)
            .enter().append('g')
            .attr('class', function(d, i) {
                return 'bar-' + score_type + '-' + chart_types + ' bar-layer-' + i
            })
            .style('cursor', 'pointer')
            .on('mouseover', function(d, i) {
                let x = d3.event.pageX - document.getElementById(score_body.attr('id')).getBoundingClientRect().x;
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                tooltip.html('Layer' + (i+1) + ' = ' + d.toFixed(2))
                    .style('width', 'auto')
                    .style('left', x + 'px')
                    .style('top', (yScale(i) + 25) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .on('click', function(d, i) {

                // Selection
                let layer = d3.selectAll('.bar-layer-' + i);

                // Draw heatmap
                if (layer.classed('select')) {
                    layer.classed('select', false);
                    //console.log('not select');
                    layer.attr('stroke', 'none');
                    selectedLayer.splice(selectedLayer.indexOf(i), 1);
                    console.log(selectedLayer);
                    remove_layer(i);
                    //Redrae
                    heatmap(alldata, selectedLayer);
                    distribution(alldata, selectedLayer[0]);

                } else {
                    layer.classed('select', true);
                    //console.log('select');
                    layer.attr('stroke', '#252525').attr('stroke-width', 2);
                    selectedLayer.push(i);
                    console.log(selectedLayer);
                    // i = layer id
                    add_layer(i);
                    // Redraw
                    heatmap(alldata, selectedLayer);
                    distribution(alldata, selectedLayer[0]);
                    // May draw gallery hree
                }

            });

        bar.append('rect')
            .attr('class', score_type + '-' + chart_type[i] + '-bg')
            .attr('x', 0 )
            .attr('y', function(d, i) {
                return yScale(i);
            })
            .attr('width', width)
            .attr('height', yScale.bandwidth())
            .attr('fill', '#f0f0f0');

        bar.append('rect')
            .attr('class', score_type + '-' + chart_type[i] + '-rect')
            .attr('x', function(d) {
                return xScale(Math.min(0, d));
            })
            .attr('y', function(d, i) {
                return yScale(i);
            })
            .attr('width', function (d) {
                return Math.abs(xScale(d) - xScale(0));
            })
            .attr('height', yScale.bandwidth())
            .attr('fill', (score_type === 'positive') ? '#cb181d' : '#2171b5');

        svg.append('g')
            .attr('transform', 'translate(0,0)')
            .call(xAxis);

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -17)
            .style('font-size', '12px')
            .attr('text-anchor', 'middle')
            .text(chart_label[i]);
    }*/
}

function add_segment_legend(container, segment_Data)
{
    // Add segment list
    let segment_list = $('<div/>').css({
        width: '100%',
        height: '20px',
        'line-height': '20px',
        'position': 'relative',
        'overflow-y': 'hidden',
        'overflow-x': 'auto'
    });

    for (var i = 0; i < segment_Data.length; ++i) {
        let segment = $('<div/>').css({
            width: '100px',
            height: '20px',
            'line-height': '20px',
            'background-color': segmentColors[i],
            'font-size': '14px',
            'text-align': 'center',
            'float': 'left'
        }).html('Segment ' + (i + 1));

        segment_list.append(segment);
    }

    container.append(segment_list);
}

// Preprocess data for barchart
function preprocess_data(data, lrp_data)
{
    let layers = [];

    // Get all scores
    for (let i = 0; i < data.length; ++i) {

        // Read layer data
        let layer_data = data[i];

        // Create layer structure
        let layer = {
            activation_range: undefined,
            relevance_absolute_range: undefined,
            relevance_combination_range: undefined,
            relevance_negative_range: undefined,
            relevance_positive_range: undefined,
            activation_mean: undefined,
            relevance_mean_absolute: undefined,
            relevance_mean_combination: undefined,
            relevance_mean_negative: undefined,
            relevance_mean_positive: undefined,
            activation_std: undefined,
            relevance_std_absolute: undefined,
            relevance_std_combination: undefined,
            relevance_std_negative: undefined,
            relevance_std_positive: undefined
        };

        let activation_sum = [];
        let relevance_sum_absolute = [];
        let relevance_sum_combination = [];
        let relevance_sum_negative = [];
        let relevance_sum_positive = [];

        // Store all scores
        Object.keys(layer_data).forEach(function(node) {
            activation_sum.push(layer_data[node]['activation_sum']);
            relevance_sum_absolute.push(layer_data[node]['relevance_sum_absolute']);
            relevance_sum_combination.push(layer_data[node]['relevance_sum_combination']);
            relevance_sum_negative.push(layer_data[node]['relevance_sum_negative']);
            relevance_sum_positive.push(layer_data[node]['relevance_sum_positive']);
        });

        // Compute all mean and standard deviation
        layer.activation_mean = d3.mean(activation_sum);
        layer.relevance_mean_absolute = d3.mean(relevance_sum_absolute);
        layer.relevance_mean_combination = d3.mean(relevance_sum_combination);
        layer.relevance_mean_negative = d3.mean(relevance_sum_negative);
        layer.relevance_mean_positive = d3.mean(relevance_sum_positive);
        layer.activation_std = d3.deviation(activation_sum);
        layer.relevance_std_absolute = d3.deviation(relevance_sum_absolute);
        layer.relevance_std_combination = d3.deviation(relevance_sum_combination);
        layer.relevance_std_negative = d3.deviation(relevance_sum_negative);
        layer.relevance_std_positive = d3.deviation(relevance_sum_positive);

        // Compute ranges
        layer.activation_range = [d3.min(activation_sum), d3.max(activation_sum)];
        layer.relevance_absolute_range = [d3.min(relevance_sum_absolute), d3.max(relevance_sum_absolute)];
        layer.relevance_combination_range = [d3.min(relevance_sum_combination), d3.max(relevance_sum_combination)];
        layer.relevance_negative_range = [d3.min(relevance_sum_negative), d3.max(relevance_sum_negative)];
        layer.relevance_positive_range = [d3.min(relevance_sum_positive), d3.max(relevance_sum_positive)];

        //layer.color =
        for (let j = 0; j < lrp_data.length; ++j) {
            let x0 = lrp_data[j].x0 - 1;
            let x1 = lrp_data[j].x1 - 1;
            if (i >= x0 && i <= x1) {
                layer.color = segmentColors[j];
            }
        }

        layers.push(layer);
    }

    return layers;
}

// Draw relevance negative

    /*
    for (let i = 0; i < score_types.length; ++i) {
        let score_text = score_texts[i];
        let score_type = score_types[i];
        let score_color = score_colors[i];
        let score_range = score_ranges[i];
        let score_mean = score_means[i];
        let score_std = score_stds[i];



        // Create score container
        let score_container = $('<div/>', { id: score_type + '-chart' });

        score_container.css({
            position: 'relative',
            height: container.height() / score_types.length,
            width: '100%',
            'box-sizing': 'border-box',
            'float': 'left',
            'border': '1px solid #f0f0f0'
        });

        container.append(score_container);

        // Add chart title
        let title = d3.select('#' + score_container.attr('id')).append('div')
            .attr('class', 'lrp-analysis-chart-title')
            .style('z-index', 1000)
            .html(score_text);

        // Add tooltip
        let tooltip = d3.select('#' + score_container.attr('id')).append('div')
            .attr('class', 'lrp-analysis-tooltip')
            .style('z-index', 1000)
            .style('opacity', 0);

        let margin = {top:  40, right: 20,  bottom: 30, left: 40};
        let width = score_container.width() - margin.left - margin.right;
        let height = score_container.height() - margin.top - margin.bottom;

        let svg = d3.select('#' + score_container.attr('id')).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        let xScale = d3.scaleBand().domain(node_data.map(function(d, i) {
            return i;
        })).range([0, width]).padding(0.1);

        let min_Yaxis = d3.min(node_data.map(function(d) { return d[score_mean]}));

        let max_Yaxis = d3.max(node_data.map(function(d) { return d[score_mean]}));

        let yScale = (score_range === "relevance_negative_range") ?     d3.scaleLinear().domain([0, min_Yaxis])
                .range([0, height])
            : d3.scaleLinear().domain([0, max_Yaxis])
                .range([height, 0]);

        let bars = svg.selectAll('.bar-' + score_type)
            .data(node_data)
            .enter().append('g')
            .attr('class', function(d, i) {
                return 'bar-' + score_type + ' bar-layer-' + i
            })
            .style('cursor', 'pointer')
            .on('mouseover', function(d, i) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);

                let tooltip_str = "Mean: " + d[score_mean].toFixed(2) + "<br/>Standard Deviation: " + d[score_std].toFixed(2) + "<br/>[Min, Max]: [" + d[score_range][0].toFixed(2) + ', ' + d[score_range][1].toFixed(2) + "]";

                tooltip.html(tooltip_str)
                    .style('left', xScale(i) + 'px')
                    .style('top', (height/2) + 'px');
            })
            .on('mouseout', function() {
                //d3.select(this).attr('stroke', 'none');
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .on('click', function(d, i) {

                let layer = d3.selectAll('.bar-layer-' + i);

                // Draw heatmap
                if (layer.classed('select')) {
                    layer.classed('select', false);
                    console.log('not select');
                    layer.attr('stroke', 'none');
                    selectedLayer.splice(selectedLayer.indexOf(i), 1);
                    console.log(selectedLayer);

                    //Redrae
                    heatmap(data, selectedLayer);
                } else {
                    layer.classed('select', true);
                    console.log('select');
                    layer.attr('stroke', '#000');
                    selectedLayer.push(i);
                    console.log(selectedLayer);

                    // Redraw
                    heatmap(data, selectedLayer);
                    distribution(data, selectedLayer[0]);
                }
            });

        // Bar background
        bars.append('rect')
            .attr('class', 'bar-bg-' + score_type)
            .attr('x', function(d, i) { return xScale(i); })
            .attr('y', 0)
            .attr('width', xScale.bandwidth())
            .attr('opacity', 0.2)
            .attr('fill', function(d) { return d.color; })
            //.transition().delay(100)
            .attr('height', height);

        // Bar rectangle
        bars.append('rect')
            .attr('class', 'bar-rect-' + score_type)
            .attr('x', function(d, i) { return xScale(i); })
            .attr('y', (score_range === 'relevance_negative_range') ? 0 : function(d) { return yScale(d[score_mean]); })
            .attr('height', (score_range === 'relevance_negative_range') ? function(d) { return yScale(d[score_mean]);} : function(d) { return height - yScale(d[score_mean]);})
            .attr('width', xScale.bandwidth())
            .attr('fill', score_color);
            //.attr('stroke', '#000');

        // Add std error line


        bars.append('line')
            .attr('class', 'bar-line-' + score_type)
            .attr('y1', function(d) { return yScale(d[score_mean] - d[score_std]); })
            .attr('x1', function(d, i) { return xScale(i) + xScale.bandwidth()/2; })
            .attr('y2', function(d) { return yScale(d[score_mean] + d[score_std]); })
            .attr('x2', function(d, i) { return xScale(i) + xScale.bandwidth()/2; })
            .style('stroke', '#000')
            .style('stroke-dasharray', '1,1');

        // Add std left line
        bars.append('line')
            .attr('class', 'bar-left-line-' + score_type)
            .attr('y1', function(d) { return yScale(d[score_mean] - d[score_std]); })
            .attr('x1', function(d, i) { return xScale(i) + 10; })
            .attr('y2', function(d) { return yScale(d[score_mean] - d[score_std]); })
            .attr('x2', function(d, i) { return xScale(i) + xScale.bandwidth() - 10 })
            .style('stroke', '#000');

        // Add std right line
        bars.append('line')
            .attr('class', 'bar-right-line-' + score_type)
            .attr('y1', function(d) { return yScale(d[score_mean] + d[score_std]); })
            .attr('x1', function(d, i) { return xScale(i) + 10; })
            .attr('y2', function(d) { return yScale(d[score_mean] + d[score_std]); })
            .attr('x2', function(d, i) { return xScale(i) + xScale.bandwidth() - 10 })
            .style('stroke', '#000');


        if (score_range === "relevance_negative_range") {
            svg.append('g')
                .attr('transform', 'translate(0,0)')
                .call(d3.axisRight(yScale).tickSize(2).tickValues([0, min_Yaxis]).tickPadding(-17));

            svg.append('g')
                .attr('transform', 'translate(0,0)')
                .call(d3.axisTop(xScale).tickFormat(function(d,i) { return (i); }));
        } else {
            svg.append('g')
                .attr('transform', 'translate(0,0)')
                .call(d3.axisRight(yScale).tickSize(2).tickValues([0, max_Yaxis]).tickPadding(-17));

            svg.append('g')
                .attr('transform', 'translate(0,' + height + ')')
                .call(d3.axisBottom(xScale).tickFormat(function(d,i) { return (i); }));
        }
    }*/