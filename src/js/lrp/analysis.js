import $ from 'jquery';
import * as util from '../utils';
import * as d3 from 'd3';
import Path from 'path';
import * as main from '..';
import { segmentColors } from './listSegments';
import ChildProcess from 'child_process';
import kill from 'tree-kill';
import fs from 'fs';
import path from 'path';
import flipNode from './flipNode';
import { drawBarChart } from '.';

let childProcess = undefined;
var analysisBody = $('#lrp-analysis-body');
let node_list = {};

// Conservation_scores (TODO)
var conservation_path = Path.join(__dirname, '..', '..', '..', 'conservation_scores', 'conservation_scores.pickle');
// Entropy_scores (TODO)
var entropy_path = Path.join(__dirname, '..', '..', '..', 'entropy_scores', 'entropy_scores.pickle');

// Intermediate_scores
var intermediate_dir = Path.join(__dirname, '..', '..', '..', 'intermediate_scores');

export default function()
{
    // Clear analysis body
    analysisBody.empty();
    node_list = {};

    // Add segment list
    let data = undefined;
    if (main.getLrpCurrentSaveData()) {
        data = main.getLrpCurrentSaveData();
    } else {
        data = main.getLrpCurrentData();
    }

    read_pickle_files().then(function(result) {
        draw_barchart(result, analysisBody, 100, data);
    });

}

// Read all pickle files
function read_pickle_files()
{
    let promises = [];

    /* Read all files for every layer */
    for (let i = 0; i < 39; ++i) {
        let filepath = Path.join(intermediate_dir, 'intermediate_scores_' + i + '.pickle');
        promises.push(util.readPickle(filepath).then(data => { return data; }));
    }

    return Promise.all(promises);
}

// Draw barchart
function draw_barchart(data, container, containerHeight, lrp_data)
{
    container.empty();

    // Add segment list
    let segment_list = $('<div/>').css({
        width: '100%',
        height: '20px',
        'line-height': '20px',
        'position': 'relative',
        'overflow-y': 'hidden',
        'overflow-x': 'auto'
    });

    for (var i = 0; i < lrp_data.length; ++i) {
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

    let score_types = ['activation_sum', 'relevance_sum_absolute', 'relevance_sum_combination',  'relevance_sum_negative', 'relevance_sum_positive'];
    let score_texts = ['Activation sum', 'Relevance sum absolute', 'Relevance sum combination',  'Relevance sum negative', 'Relevance sum positive'];
    let score_means = ['activation_mean', 'relevance_mean_absolute', 'relevance_mean_combination',  'relevance_mean_negative', 'relevance_mean_positive'];
    let score_stds = ['activation_std', 'relevance_std_absolute', 'relevance_std_combination',  'relevance_std_negative', 'relevance_std_positive'];
    let score_ranges = ['activation_range', 'relevance_absolute_range', 'relevance_combination_range',  'relevance_negative_range', 'relevance_positive_range'];

    let score_colors = ['#fbb4ae','#b3cde3','#ccebc5','#decbe4','#fed9a6'];

    let preprocessed_data = preprocess_data(data, lrp_data);
    console.log(preprocessed_data);

    let barchartContainer = $('<div/>', {
        id: 'lrp-analysis-barchart'
    }).css({
        width: '100%',
        height: 'calc(' + containerHeight + '% - 20px)',
        'box-sizing': 'border-box',
        'float': 'left'
    });

    container.append(barchartContainer);

    for (let i = 0; i < score_types.length; ++i) {

        let score_text = score_texts[i];
        let score_type = score_types[i];
        let score_color = score_colors[i];
        let score_range = score_ranges[i];
        let score_mean = score_means[i];
        let score_std = score_stds[i];

        let score_container = $('<div/>', { id: score_type + '-chart' });
        score_container.css({
            position: 'relative',
            width: barchartContainer.width() / score_types.length,
            height: '100%',
            'box-sizing': 'border-box',
            'float': 'left'
        });

        barchartContainer.append(score_container);

        let title = d3.select('#' + score_container.attr('id')).append('div')
            .attr('class', 'lrp-analysis-chart-title')
            .style('z-index', 1000)
            .html(score_text);

        // Add tooltip
        let tooltip = d3.select('#' + score_container.attr('id')).append('div')
            .attr('class', 'lrp-analysis-tooltip')
            .style('z-index', 1000)
            .style('opacity', 0);

        let margin = {top:  40, right: 20,  bottom: 30, left: 40}
        let width = score_container.width() - margin.left - margin.right;
        let height = score_container.height() - margin.top - margin.bottom;

        let svg = d3.select('#' + score_container.attr('id')).append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        let yScale = d3.scaleBand().domain(preprocessed_data.map(function(d, i) { return i; })).range([0, height]).padding(0.1);

        let min_Xaxis = d3.min(preprocessed_data.map(function(d) { return d[score_range][0]}));

        let max_Xaxis = d3.max(preprocessed_data.map(function(d) { return d[score_range][1]}));

        let xScale = d3.scaleLinear().domain([ min_Xaxis, max_Xaxis]).range([0, width]);

        let bars = svg.selectAll('.bar-' + score_type)
            .data(preprocessed_data)
            .enter().append('g')
            .attr('class','bar-' + score_type)
            .style('cursor', 'pointer')
            .on('mouseover', function(d, i) {

                d3.select(this).attr('stroke', '#000');

                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);

                let tooltip_str = "Mean: " + d[score_mean].toFixed(2) + "<br/>Standard Deviation: " + d[score_std].toFixed(2) + "<br/>[Min, Max]: [" + d[score_range][0].toFixed(2) + ', ' + d[score_range][1].toFixed(2) + "]";

                tooltip.html(tooltip_str)
                    .style('left', width + 'px')
                    .style('top', yScale(i) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('stroke', 'none');
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .on('click', function(d, i) {
                // Do better with redraw and resize
                draw_barchart(data, analysisBody, 50, lrp_data);
                add_layer_analysis(analysisBody, data, i);
            });

        bars.append('rect')
            .attr('class',  'bar-bg-' + score_type)
            .attr('x', 0)
            .attr('y', function(d, i) { return yScale(i); })
            .attr('height', yScale.bandwidth())
            .attr('opacity', 0.1)
            .attr('fill', function(d) { return d.color; })
            .transition().delay(100)
            .attr('width', width);

        bars.append('rect')
            .attr('class',  'bar-rect-' + score_type)
            .attr('x', function(d) { return xScale(d[score_range][0]); })
            .attr('y', function(d, i) { return yScale(i); })
            .attr('height', yScale.bandwidth())
            .attr('fill', score_color)
            .transition().delay(100)
            .attr('width', function(d) { return Math.abs(xScale(d[score_range][1]) - xScale(d[score_range][0])) });

        bars.append('rect')
            .attr('class',  'bar-mean-' + score_type)
            .attr('x', function(d) { return xScale(d[score_mean]); })
            .attr('y', function(d, i) { return yScale(i); })
            .attr('height', yScale.bandwidth())
            .attr('fill', '#000')
            .transition().delay(100)
            .attr('width', 1);

        // Add std error line
        bars.append('line')
            .attr('class', 'bar-line-' + score_type)
            .attr('x1', function(d) { return xScale(d[score_mean] - d[score_std]); })
            .attr('y1', function(d, i) { return yScale(i) + yScale.bandwidth()/2; })
            .attr('x2', function(d) { return xScale(d[score_mean] + d[score_std]); })
            .attr('y2', function(d, i) { return yScale(i) + yScale.bandwidth()/2; })
            .style('stroke', '#000')
            .style('stroke-dasharray', '1,1');

        // Add std left line
        bars.append('line')
            .attr('class', 'bar-left-line-' + score_type)
            .attr('x1', function(d) { return xScale(d[score_mean] - d[score_std]); })
            .attr('y1', function(d, i) { return yScale(i) + 6; })
            .attr('x2', function(d) { return xScale(d[score_mean] - d[score_std]); })
            .attr('y2', function(d, i) { return yScale(i) + yScale.bandwidth() - 6 })
            .style('stroke', '#000');

        // Add std right line
        bars.append('line')
            .attr('class', 'bar-right-line-' + score_type)
            .attr('x1', function(d) { return xScale(d[score_mean] + d[score_std]); })
            .attr('y1', function(d, i) { return yScale(i) + 6; })
            .attr('x2', function(d) { return xScale(d[score_mean] + d[score_std]); })
            .attr('y2', function(d, i) { return yScale(i) + yScale.bandwidth() - 6 })
            .style('stroke', '#000');


        svg.append('g')
            .attr('transform', 'translate(0,0)')
            .call(d3.axisBottom(xScale).tickSize(2).tickValues([min_Xaxis, max_Xaxis]).tickPadding(-12));

        svg.append('g')
            .call(d3.axisLeft(yScale).tickFormat(function(d,i) { return 'L' + (i + 1); }));
    }
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

function add_layer_analysis(container, data, layer_id)
{

    $('.layer-analysis-container').remove();

    // Need to add multiple tab here

    let layer_container = $('<div/>', {
        id: 'layer-analysis-container'
    }).css({
        width: '50%',
        height: '50%',
        'box-sizing': 'border-box',
        'float': 'left',
        'background-color': '#fff',
        //'border': '1px solid #000',
        'text-align': 'center',
        'font-size': '12px'
    }).html('Node Distribution for Layer: ' + layer_id);

    let node_container = $('<div/>', {
        id: 'node-analysis-container'
    }).css({
        width: '50%',
        height: '50%',
        'box-sizing': 'border-box',
        'float': 'left',
        'background-color': '#fff',
        //'border': '1px solid #000',
        'text-align': 'center',
        'font-size': '12px'
    });

    container.append(layer_container);
    container.append(node_container);

    let layer_data = data[layer_id];
    //console.log(layer_data);

    // Score types
    let score_types = ['activation_sum', 'relevance_sum_absolute', 'relevance_sum_combination',  'relevance_sum_negative', 'relevance_sum_positive'];
    let score_labels = ['Activation', 'Relevance (abs)', 'Relevance (combine)',  'Relevance (-)', 'Relevancee (+)'];
    let score_colors = ['#fbb4ae','#b3cde3','#ccebc5','#decbe4','#fed9a6'];

    // Draw line
    for (let i = 0; i < score_types.length; ++i) {

        var chart_container = $('<div/>', {
            id: 'scatterplot-' + i
        }).css({
            width: '100%',
            height: layer_container.height() / score_types.length
        });

        layer_container.append(chart_container);

        var margin = { top: 10, right: 30, bottom: 30, left: 100},
            width = chart_container.width() - margin.left - margin.right,
            height = chart_container.height() - margin.top - margin.bottom;

        var svg = d3.select('#' + chart_container.attr('id'))
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        var y = d3.scaleBand()
            .range([0, height])
            .domain([score_labels[i]])
            .padding(.4);

        svg.append('g')
            .call(d3.axisLeft(y).tickSize(1))
            .select('.domain').remove();

        let score_data = [];
        Object.keys(layer_data).forEach(function(node) {
            let node_data = {
                id: parseInt(node.split('_')[1]),
                score: layer_data[node][score_types[i]],
                label: score_labels[i],
                type: score_types[i]
            };
            score_data.push(node_data);
        });

        let x = d3.scaleLinear()
            .domain([d3.min(score_data, function(d) { return d.score; }), d3.max(score_data, function(d) { return d.score; })])
            .range([0, width]);

        svg.append('line')
            .attr('y1', y(score_labels[i]) + (y.bandwidth() / 2))
            .attr('y2', y(score_labels[i]) + (y.bandwidth() / 2))
            .attr('x1', 0)
            .attr('x2', width)
            .style('stroke', 'black')
            .style('stroke-width', 1);

        svg.append('g')
            .call(d3.axisBottom(x).tickSize(1))
            .attr('transform', 'translate(0,' + (y.bandwidth() * 2) + ')')
            .select('.domain').remove();

        let jitter_width = 40;
        let dots = svg.selectAll('score-dot-' + i)
            .data(score_data)
            .enter()
            .append('circle')
            .attr('r', 4)
            .attr('class', function(d) { return 'dots node-' + d.id; })
            .style('fill', score_colors[i])
            .style('opacity', 0.5)
            .attr('cy', function(d) { return y(d.label) + (y.bandwidth()/2) - jitter_width/2 + Math.random() * jitter_width })
            .attr('cx', function(d) { return x(d.score); });

        let brush = d3.brush()
            .on("brush", brushed)
            .on("end", brushended);

        svg.append('g')
            .call(brush);

        function brushed() {
            if (d3.event.selection != null) {
                let brush_coords = d3.brushSelection(this);

                d3.selectAll('.dots').style('fill', '#d9d9d9')
                    .style('opacity', 0.5)
                    .style('stroke', 'none');

                dots.filter(function() {
                    let cx = d3.select(this).attr('cx'),
                        cy = d3.select(this).attr('cy');
                    return isBrushed(brush_coords, cx, cy);
                }).attr('class', function(d) {
                    d3.selectAll('.node-' + d.id)
                        .style('fill', function(d) {
                            return score_colors[score_labels.indexOf(d.label)];
                        })
                        .style('opacity', 1)
                        .style('stroke', '#000')
                        .moveToFront();

                    return 'dots node-' + d.id;
                });
            }
        }

        function brushended() {
            const selection = d3.event.selection;
            if (!d3.event.sourceEvent || !selection) return;
            d3.select(this).transition().call(brush.move, null);

            let brush_coords = d3.brushSelection(this);
            let filtered_nodes = dots.filter(function() {
                let cx = d3.select(this).attr('cx'),
                    cy = d3.select(this).attr('cy');

                return isBrushed(brush_coords, cx, cy);
            });

            let selected_ids = [];
            filtered_nodes.attr('id', function(d) {
                selected_ids.push(d.id);
            });

            update_node_heatmap(selected_ids, layer_id);
        }


        function isBrushed(brush_coords, cx, cy) {

            var x0 = brush_coords[0][0],
                x1 = brush_coords[1][0],
                y0 = brush_coords[0][1],
                y1 = brush_coords[1][1];

           return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
       }
    }

    // Show node gallery
    node_heatmap(node_container);
    return;
}

function node_heatmap(container)
{
    let gallery = $('<div/>').css({
        width: '100%',
        height: 'calc(100% - 30px)',
        'box-sizing': 'border-box'
    });

    let gallery_title = $('<div/>').css({
        width: '100%',
        height: '30px',
        'box-sizing': 'border-box',
    }).html('Node Activation and Relevance Heatmap');

    let gallery_body = $('<div/>', {
        'id': 'nodes-gallery-body'
    }).css({
        width: '100%',
        height: 'calc(100% - 30px)',
        'box-sizing': 'border-box',
    }).html('Please select nodes on the distribution panel');

    gallery.append(gallery_title);
    gallery.append(gallery_body);

    container.append(gallery);

    // Add node ablation button
    let ablation_container = $('<div/>').css({
        width: '100%',
        height: '30px',
        'box-sizing': 'border-box',
        'text-align': 'center'
    });

    let ablation_button = $('<div/>').css({
        width: 'auto',
        height: '30px',
        'line-height': '30px',
        'box-sizing': 'border-box',
        'background-color': '#1666ba',
        'color': '#fff',
        'cursor': 'pointer'
    }).html('Ablate selected node heatmap');

    container.append(ablation_container);
    ablation_container.append(ablation_button);

    ablation_button.on('click', function() {
        flipNode(node_list).then(function(result) {
            console.log(result);
            update_prediction_barchart($('#lrp-result-class-input'), result)
        });
    });

    return;
}

function update_prediction_barchart(container, new_prediction)
{
    container.empty();
    let old_prediction = main.getOriginalPrediction();
    console.log(new_prediction);
    console.log(old_prediction);

    let left_container = $('<div/>', {
        id: 'left-prediction'
    }).css({
        width: '50%',
        height: '100%',
        float: 'left',
        'box-sizing': 'border-box',
        'padding': '5px',
    });

    let right_container = $('<div/>', {
        id: 'right-prediction'
    }).css({
        width: '50%',
        height: '100%',
        float: 'left',
        'box-sizing': 'border-box',
        'padding': '5px',
    });

    container.append(left_container);
    container.append(right_container);

    $('#lrp-class-title').html('Prediction vs Ablation Classes');

    drawBarChart(left_container.attr('id'), old_prediction, false, '#fdb462');
    drawBarChart(right_container.attr('id'), new_prediction, false, '#b3de69');
}

function update_node_heatmap(nodes, layer_id)
{

    node_list[layer_id] = nodes;

    if (childProcess) {
        kill(childProcess.pid, function() {
            generate_heatmap(nodes, 'A').then(function() {
                show_all_heatmap();
                generate_heatmap(nodes, 'R').then(function() {
                    show_all_heatmap_R();
                });
            });
        });
    } else {
        generate_heatmap(nodes, 'A').then(function() {
            show_all_heatmap();
            generate_heatmap(nodes, 'R').then(function() {
                show_all_heatmap_R();
            });
        });
    }

    function generate_heatmap(node_id, data_x)
    {
        return new Promise(function(resolve, reject) {

            childProcess = ChildProcess.spawn('python3', ['./src/lrp_pytorch/generateHeatmap.py', ['-l'+layer_id], ['-n' + JSON.stringify(nodes)], ['-d' + data_x]], {detached: true});

            childProcess.stdout.on('data', function(data) {
                //console.log(data.toString());
            });

            childProcess.stderr.on('data', function(error) {
                reject(error.toString());
            });

            childProcess.on('close', function() {
                resolve('done');
                childProcess = undefined;
            });

        });
    }

    function show_all_heatmap()
    {
        let intermediate_path = path.join(__dirname, '..', '..', '..', 'intermediate_NodesA');

        fs.readdir(intermediate_path, function(error, files) {
            if (error) throw error;

            let container = $('#nodes-gallery-body');
            // Clear node body
            container.empty();
            let A_container = $('<div/>').css({
                width: '100%',
                height: '50%',
                'box-sizing': 'border-box',
                'overflow-x': 'hidden',
                'overflow-y': 'auto',
                //'background-color': '#fddbc7',
                'padding': '2px'
            });

            container.append(A_container);

            files.forEach(function(file_name) {
                if (file_name.split('_').length === 6) {
                    // append image gallery
                    let node_image = $('<img/>', {
                        alt:'',
                        src: path.join(intermediate_path, file_name)
                    }).css({
                        width: '60px',
                        height: '60px',
                        float: 'left',
                        margin: '5px',
                        'cursor': 'pointer'
                    });

                    A_container.append(node_image);

                    node_image.hover(function() {
                        let image_detail = $('<div/>', {
                            id: 'node-image-detail'
                        }).css({
                            position: 'absolute',
                            'right': '10px',
                            'top': '5px',
                            'width': '300px',
                            'height': '300px',
                            'z-index': '1000',
                        });

                        analysisBody.append(image_detail);
                        image_detail.append(node_image.clone().css({
                            width: '100%',
                            height: '100%',
                            'box-sizing': 'border-box'
                        }));

                    }, function() {
                        $('#node-image-detail').remove();
                    });
                }
            });
        });
    }

    function show_all_heatmap_R()
    {
        let intermediate_path = path.join(__dirname, '..', '..', '..', 'intermediate_NodesR');

        fs.readdir(intermediate_path, function(error, files) {
            if (error) throw error;

            let container = $('#nodes-gallery-body');
            let R_container = $('<div/>').css({
                width: '100%',
                height: '50%',
                'box-sizing': 'border-box',
                'overflow-x': 'hidden',
                'overflow-y': 'auto',
                //'background-color': '#d1e5f0',
                'padding': '2px'
            });

            container.append(R_container);

            files.forEach(function(file_name) {
                if (file_name.split('_').length === 6) {
                    // append image gallery
                    let node_image = $('<img/>', {
                        alt:'',
                        src: path.join(intermediate_path, file_name)
                    }).css({
                        width: '60px',
                        height: '60px',
                        float: 'left',
                        margin: '5px',
                        'cursor': 'pointer'
                    });

                    R_container.append(node_image);

                    node_image.hover(function() {
                        let image_detail = $('<div/>', {
                            id: 'node-image-detail'
                        }).css({
                            position: 'absolute',
                            'right': '10px',
                            'top': '5px',
                            'width': '300px',
                            'height': '300px',
                            'z-index': '1000',
                        });

                        analysisBody.append(image_detail);
                        image_detail.append(node_image.clone().css({
                            width: '100%',
                            height: '100%',
                            'box-sizing': 'border-box'
                        }));

                    }, function() {
                        $('#node-image-detail').remove();
                    });
                }
            });
        });
    }
}


d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};