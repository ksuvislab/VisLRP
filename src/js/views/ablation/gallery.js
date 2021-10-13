import $ from 'jquery';
import * as d3 from 'd3';
import path from 'path';
import ChildProcess from 'child_process';
import kill from 'tree-kill';
import fs from 'fs';
import { flipNode, drawBarChart } from '../../lrp';
import * as main from '../../';
import { get_node_list } from './nodelist';

let childProcess = undefined;
let container = $('#ablate-gallery-body');

let temp_layer = undefined;
let temp_nodes = [];

export default function(nodes, layer_id)
{
    container.empty();

    /*
    if (temp_layer !== layer_id || !temp_layer) {
        temp_layer = layer_id;
        temp_nodes = nodes;
    }*/

    // Add title
    let R_title = $('<div/>').css({
        width: '50%',
        height: '20px',
        'line-height': '20px',
        'font-size': '14px',
        'box-sizing': 'border-box',
        'overflow-x': 'hidden',
        'overflow-y': 'auto',
        'background': '#252525',
        'color': '#fff',
        'border': '1px solid #f0f0f0',
        'float': 'left',
        'text-align': 'center'
    }).html('Relevance Heatmap');

    let A_title = $('<div/>').css({
        width: '50%',
        height: '20px',
        'line-height': '20px',
        'font-size': '14px',
        'box-sizing': 'border-box',
        'overflow-x': 'hidden',
        'overflow-y': 'auto',
        'background': '#252525',
        'color': '#fff',
        'border': '1px solid #f0f0f0',
        'float': 'left',
        'text-align': 'center'
    }).html('Activation Heatmap');

    container.append(R_title);
    container.append(A_title);


    if (childProcess) {
        kill(childProcess.pid, function() {
            disable();
            generate_heatmap(nodes, 'R').then(function() {
                show_all_heatmap_R();
                generate_heatmap(nodes, 'A').then(function() {
                    show_all_heatmap();
                    $('#disable-div').remove();
                });
            });
        });
    } else {
        disable();
        generate_heatmap(nodes, 'R').then(function() {
            show_all_heatmap_R();
            generate_heatmap(nodes, 'A').then(function() {
                show_all_heatmap();
                $('#disable-div').remove();
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
        let intermediate_path = path.join(__dirname, '..', '..', '..','..', 'intermediate_NodesA');

        fs.readdir(intermediate_path, function(error, files) {
            if (error) throw error;

            // Clear node body
            let A_container = $('<div/>', {
                id: 'activation-gallery'
            }).css({
                width: '50%',
                'font-size': '12px',
                height: 'calc(100% - 50px)',
                'box-sizing': 'border-box',
                'overflow-x': 'hidden',
                'overflow-y': 'auto',
                'border': '1px solid #f0f0f0',
                'padding': '2px',
                'float': 'left'
            });

            container.append(A_container);

            files.forEach(function(file_name) {
                if (file_name.split('_').length === 6) {
                    let image_container = $('<div/>').css({
                        position: 'relative',
                        width: '205px',
                        height: '205px',
                        float: 'left',
                        margin: '5px',
                        'cursor': 'pointer'
                    });

                    // append image gallery
                    let node_image = $('<img/>', {
                        alt:'',
                        src: path.join(intermediate_path, file_name)
                    }).css({
                        width: '100%',
                        height: '100%',
                    });
                    image_container.append(node_image);
                    A_container.append(image_container);

                    let nodeid = parseInt(file_name.split('_')[file_name.split('_').length-1]);

                    node_image.hover(function() {
                        highlight(nodeid);
                    }, function() {
                        resetHighlight(nodeid);
                    });

                    let  node_title = $('<div/>').css({
                        position: 'absolute',
                        width: 'auto',
                        height: 'auto',
                        'font-size': '14px',
                        top: 5,
                        right: 5,
                        'text-align': 'right'
                    }).html('Layer: ' + file_name.split('_')[3] + '<br/>Neuron: ' +  nodeid);
                    image_container.append(node_title);

                }
            });

            A_container.on('scroll', function () {
                $('#relevance-gallery').scrollTop($(this).scrollTop());
            });

            node_ablation();
        });
    }

    function show_all_heatmap_R()
    {
        let intermediate_path = path.join(__dirname, '..', '..', '..','..', 'intermediate_NodesR');

        fs.readdir(intermediate_path, function(error, files) {
            if (error) throw error;

            let R_container = $('<div/>', {
                id: 'relevance-gallery'
            }).css({
                width: '50%',
                'font-size': '12px',
                height: 'calc(100% - 50px)',
                'box-sizing': 'border-box',
                'overflow-x': 'hidden',
                'overflow-y': 'auto',
                'border': '1px solid #f0f0f0',
                'padding': '2px',
                'float': 'left',
            });

            container.append(R_container);

            files.forEach(function(file_name) {
                if (file_name.split('_').length === 6) {

                    let image_container = $('<div/>').css({
                        position: 'relative',
                        width: '205px',
                        height: '205px',
                        float: 'left',
                        margin: '5px',
                        'cursor': 'pointer'
                    });

                    // append image gallery
                    let node_image = $('<img/>', {
                        alt:'',
                        src: path.join(intermediate_path, file_name)
                    }).css({
                        width: '100%',
                        height: '100%',
                    });
                    image_container.append(node_image);
                    R_container.append(image_container);

                    let nodeid = parseInt(file_name.split('_')[file_name.split('_').length-1]);

                    node_image.hover(function() {
                        highlight(nodeid);
                    }, function() {
                        resetHighlight(nodeid);
                    });

                    let  node_title = $('<div/>').css({
                        position: 'absolute',
                        width: 'auto',
                        height: 'auto',
                        'font-size': '14px',
                        top: 5,
                        right: 5,
                        'text-align': 'right'
                    }).html('Layer: ' + file_name.split('_')[3] + '<br/>Neuron: ' +  nodeid);
                    image_container.append(node_title);
                }
            });

            R_container.on('scroll', function () {
                $('#activation-gallery').scrollTop($(this).scrollTop());
            });
        });
    }
}

function highlight(node_id)
{
    d3.select('#heatmap-rect-positive-' + node_id)
        .style('stroke-width', 4)
        .style('stroke', '#000');
    d3.select('#heatmap-rect-negative-' + node_id)
        .style('stroke-width', 4)
        .style('stroke', '#000');

    d3.selectAll('.node-relevance_sum_positive-' + node_id)
        .style('stroke-width', 3)
        .style('stroke', '#000')
        .moveToFront();
    d3.selectAll('.node-relevance_sum_negative-' + node_id)
        .style('stroke-width', 3)
        .style('stroke', '#000')
        .moveToFront();
    d3.selectAll('.node-activation_sum-' + node_id)
        .style('stroke-width', 3)
        .style('stroke', '#000')
        .moveToFront();
    return;
}

function resetHighlight(node_id)
{
    d3.select('#heatmap-rect-positive-' + node_id)
        .style('stroke-width', 2)
        .style('stroke', '#000');
    d3.select('#heatmap-rect-negative-' + node_id)
        .style('stroke-width', 2)
        .style('stroke', '#000');

    d3.selectAll('.node-relevance_sum_positive-' + node_id)
        .style('stroke-width', 1)
        .style('stroke', '#000')
        .moveToFront();
    d3.selectAll('.node-relevance_sum_negative-' + node_id)
        .style('stroke-width', 1)
        .style('stroke', '#000')
        .moveToFront();
    d3.selectAll('.node-activation_sum-' + node_id)
        .style('stroke-width', 1)
        .style('stroke', '#000')
        .moveToFront();
    return;
}

function node_ablation()
{
    $('#ablate-node-button').remove();
    // Add node ablation button
    let ablation_container = $('<div/>', {
        id: 'ablate-node-button'
    }).css({
        width: '100%',
        height: '30px',
        'box-sizing': 'border-box',
        'text-align': 'center',
        'float': 'left'
    });

    let ablation_button = $('<div/>').css({
        width: 'auto',
        height: '30px',
        'line-height': '30px',
        'box-sizing': 'border-box',
        'background-color': '#1666ba',
        'color': '#fff',
        'cursor': 'pointer'
    }).html('NEURONS ABLATION');

    container.append(ablation_container);
    ablation_container.append(ablation_button);

    ablation_button.on('click', function() {
        flipNode(get_node_list()).then(function(result) {
            console.log(result);
            update_prediction_barchart($('#ablate-prediction-body'), result);
        });
    });

    return;
}

function update_prediction_barchart(container, new_prediction)
{
    container.empty();

    let right_container = $('<div/>', {
        id: 'right-prediction'
    }).css({
        width: '100%',
        height: '100%',
        float: 'left',
        'box-sizing': 'border-box',
        'padding': '5px',
    });

    container.append(right_container);

    drawchart(right_container.attr('id'), new_prediction, false, '#fdb462');

    return;
}

function disable()
{
    let disable_div = $('<div/>', {
        id: 'disable-div'
    }).css({
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        'z-index': '9999',
        opacity: 0
    });

    $('body').append(disable_div);
    return;
}

function drawchart (containerId, data, isOriginal, bar_color)
{
    data = data.sort(function(a,b) {
        return d3.ascending(parseFloat(a.score), parseFloat(b.score))
    });

    // Set top class index as default
    let classIndex = parseInt(data[data.length - 1]['id']);
    main.setTargetClass(classIndex);

    let container = $('#' + containerId);
    container.empty();

    let margin = { top: 0, right: 0, bottom: 0, left: 0 };
    let width = container.width() - margin.left + margin.right;
    let height = container.height() - margin.top - margin.bottom;

    let svg = d3.select('#' + containerId).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    let x = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(data, function (d) {
            return parseFloat(d.score);
        })]);

    let y = d3.scaleBand()
        .rangeRound([height, 0])
        .padding(.1)
        .domain(data.map(function(d) {
            return d.names;
        }));

    let yAxis = d3.axisRight()
        .scale(y)
        .tickSize(0);

    let bars = svg.selectAll('.' + containerId + '-bar')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'prediction-bar');

    bars.append('rect')
        .attr('id', function(d) { return 'prediction-bar-' + d.id })
        .attr('class', function(d) { return 'pred-bar category-bar-' + d.id })
        .attr('y', function(d) {
            return y(d.names);
        })
        .style('cursor', 'pointer')
        .attr('height', y.bandwidth())
        .attr('x', 0)
        .style('fill', function(d, i) {
            return (i === data.length - 1) ? '#fdae61' : '#e0e0e0';
        })
        .style('stroke', 'none')
        .transition().delay(500)
        .attr('width', function(d) {
            return x(d.score);
        });

    // Set default prediction class
    $('#lrp-output-title').html('LRP RELEVANCE HEATMAP TO CLASS<br/>\"' + data[data.length - 1].names + '\"');

    bars.append('text')
        .attr('y', function(d) {
            return y(d.names) + y.bandwidth() / 2 + 8;
        })
        .attr('x', function(d) {
            return 0;
        })
        .style('font-size', '22px')
        .style('fill', '#000')
        //.style('stroke', '#fff')
        .text(function(d) { return parseFloat(d.score).toFixed(1); });

    bars.on('click', function(d) {

        if (isOriginal) {
            // Highlight selected class
            d3.selectAll('.pred-bar').style('fill', '#e0e0e0');
            d3.selectAll('.pred-bar').style('stroke', 'none');
            d3.select('#prediction-bar-' + d.id).style('fill', '#fdae61');
            // Set target class
            main.setTargetClass(parseInt(d.id));
            $('#lrp-output-title').html('LRP Relevance Heatmap to class<br/>' + d.names);
            lrp.run();
        }
    });

    svg.append('g')
        .attr('class', 'class-axis')
        .style('font-size', '14px')
        .attr('transform', 'translate(55, 0)')
        .call(yAxis);

    // Highlight top 3 selection

    if (parseInt(container.attr('id').split('-')[2]) === top_selection) {
        top_ids = [];
        top_ids.push(data[9].id);
        top_ids.push(data[8].id);
        top_ids.push(data[7].id);

        $('.flipping-panel').css({ 'background-color': '#f0f0f0'});
        /*
        $('#flipping-' + top_selection).css({ 'background-color': '#fff7bc'});*/
    }

    /*
    d3.selectAll('.pred-bar').style('fill', '#d9d9d9');
    let top_colors = ['#fc9272','#fcbba1','#fee0d2'];
    for (let i = 0; i < top_ids.length; ++i) {
        d3.selectAll('.category-bar-' + top_ids[i]).style('fill', top_colors[i]);
    }*/


    return;
}