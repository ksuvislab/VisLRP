import $ from 'jquery';
import * as d3 from 'd3';
import getNodeDimension from '../../utils/getNodeDimension';
import distribution from './distribution';
import { get_node_list, remove_node, add_node } from './nodelist';
import interaction from './interaction';

let container = $('#ablate-heatmap-body');

export default function(data, all_layer)
{
    //console.log(data);
    container.empty();
    // Add layer list
    add_layer_list(all_layer, data);
    drawHeatmap(all_layer[0], data);
}

function add_layer_list(layers, data)
{
    let nodes = get_node_list();

    let layer_list = $('<div/>').css({
        width: '100%',
        height: '20px',
        'line-height': '20px',
        'position': 'relative',
        'overflow-y': 'hidden',
        'overflow-x': 'auto',
        'white-space': 'nowrap'
    });

    for (let i = 0; i < layers.length; ++i) {
        let layer = $('<div/>', {
            id: 'layer-list-' + layers[i],
            class: 'layer-list'
        }).css({
            width: 'auto',
            height: '20px',
            'line-height': '20px',
            'background-color': (i === 0) ? '#252525' : '#fff',
            'color': (i === 0) ? '#fff' : '#252525',
            'font-size': '14px',
            'text-align': 'center',
            'display': 'inline-block',
            'padding-left': '5px',
            'padding-right': '5px',
            'border': '1px solid #f0f0f0',
            'cursor': 'pointer'
        }).html('Layer ' + (layers[i]));//+ ' (' + nodes[layers[i]].length + '/' + Object.keys(data[layers[i]]).length + ')');

        layer_list.append(layer);

        layer.on('click', function() {
            drawHeatmap(layers[i], data);
            distribution(data, layers[i]);
            $('.layer-list').css({ 'background-color': '#fff', 'color': '#252525' });
            layer.css({ 'background-color': '#252525', 'color': '#fff' });
        });
    }

    container.append(layer_list);
    return;
}

function drawHeatmap(layer_id, data)
{
    //console.log(layer_id);
    //console.log(data[layer_id]);

    if (!data[layer_id]) return;

    // Clear current node heatmap
    $('#node-heatmap').remove();

    let heatmap_container = $('<div/>', {
        id: 'node-heatmap'
    }).css( {
        width: '100%',
        height: 'calc(100% - 20px)',
        'box-sizing': 'border-box',
        'padding': '5px'
    });

    container.append(heatmap_container);

    let heatmap_positive_container = $('<div/>').css( {
        'position': 'relative',
        width: '50%',
        height: '100%',
        'box-sizing': 'border-box',
        'border': '1px solid #f0f0f0',
        'float': 'left'
    });

    let heatmap_negative_container = $('<div/>').css( {
        'position': 'relative',
        width: '50%',
        height: '100%',
        'box-sizing': 'border-box',
        'border': '1px solid #f0f0f0',
        'float': 'left'
    });

    heatmap_container.append(heatmap_positive_container);
    heatmap_container.append(heatmap_negative_container);

    let positive_title = $('<div/>').css( {
        width: '100%',
        height: '20px',
        'line-height': '20px',
        'box-sizing': 'border-box',
        'border': '1px solid #f0f0f0',
        'font-size': '14px',
        'text-align': 'center',
        'background': '#bedaf7',
    }).html('Positive Relevance of Neurons');

    let negative_title = $('<div/>').css( {
        width: '100%',
        height: '20px',
        'line-height': '20px',
        'box-sizing': 'border-box',
        'border': '1px solid #f0f0f0',
        'font-size': '14px',
        'text-align': 'center',
        'background': '#bedaf7',
    }).html('Negative Relevance of Neurons');

    // Left
    let heatmap_positive = $('<div/>', {
        id: 'node-heatmap-positive'
    }).css( {
        'position': 'relative',
        width: '100%',
        height: 'calc(100% - 20px)',
        'box-sizing': 'border-box',
        'border': '1px solid #f0f0f0'
    });

    // Right
    let heatmap_negative = $('<div/>', {
        id: 'node-heatmap-negative'
    }).css( {
        'position': 'relative',
        width: '100%',
        height: 'calc(100% - 20px)',
        'box-sizing': 'border-box',
        'border': '1px solid #f0f0f0'
    });

    heatmap_positive_container.append(positive_title);
    heatmap_positive_container.append(heatmap_positive);
    heatmap_negative_container.append(negative_title);
    heatmap_negative_container.append(heatmap_negative);

    let dim = getNodeDimension(Object.keys(data[layer_id]).length);

    let draw_data = [];

    let row = 0;
    let col = 0;
    Object.keys(data[layer_id]).forEach(function(node) {

        if (col >= dim[0]) {
            col = 0;
            ++row;
        }

        let node_data = {
            id: parseInt(node.split('_')[node.split('_').length - 1]),
            positive: data[layer_id][node]['relevance_sum_positive'],
            negative: data[layer_id][node]['relevance_sum_negative'],
            x: col,
            y: row
        };

        draw_data.push(node_data);
        ++col;
    });

    draw(heatmap_positive, draw_data, 'positive', dim, data);
    draw(heatmap_negative, draw_data, 'negative', dim, data);
    interaction(layer_id, data);

    // Start drawing heatmap
    function draw(container, data, score_type, dimension, all_data) {

        let colorType = {
            positive: d3.interpolateReds,
            negative: d3.interpolateBlues
        }

        container.empty();

        let margin = {top:  5, right: 5,  bottom: 5, left: 5}
        let width = container.width() - margin.left - margin.right;
        let height = container.height() - margin.top - margin.bottom;

        let svg = d3.select('#' + container.attr('id'))
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // Draw rectangle
        let xScale = d3.scaleLinear().domain([0, dimension[0]]).range([0, width]);

        let yScale = d3.scaleLinear().domain([0, dimension[1]]).range([0, height]);

        let tooltip = d3.select('#' + container.attr('id')).append('div')
            .attr('class', 'lrp-analysis-tooltip')
            .style('z-index', 1000)
            .style('opacity', 0)
            .style('width', 'auto');

        var color = undefined;

        if (score_type === 'positive') {
            color = d3.scaleSequential(colorType[score_type])
            .domain([d3.min(data, function(d) { return d[score_type]; }), d3.max(data, function(d) { return d[score_type];})]);
        } else {
            color = d3.scaleSequential(colorType[score_type])
            .domain([d3.max(data, function(d) { return d[score_type]; }), d3.min(data, function(d) { return d[score_type];})]);
        }

        // Get node list here
        let nodes = get_node_list();

        let rect = svg.selectAll('.heatmap-rect-' + score_type)
            .data(data)
            .enter().append('g')
            .attr('class', 'heatmap-rect-' + score_type)
            .style('cursor', 'pointer')
            .on('mouseover', function(d, i) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                let nodestr = "Neuron: " + d.id + "<br/>Score: " + d[score_type].toFixed(2) + ""
                tooltip.html(nodestr)
                    .style('left', (xScale(d.x) + 25) + 'px')
                    .style('top', yScale(d.y) + 'px');
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            })
            .on('click', function(d, i) {
                if (d3.select('#heatmap-rect-' + score_type + '-' + d.id).classed('select')) {
                    // Remove node
                    remove_node(layer_id, d.id);
                    // Universal interaction
                    interaction(layer_id, all_data);
                } else {
                    // Add node
                    add_node(layer_id, d.id);
                    // Universal interaction
                    interaction(layer_id, all_data);
                }
            });

        rect.append('rect')
            .attr('id', function(d) {
                return 'heatmap-rect-' + score_type + '-' + d.id;
            })
            .attr('class', 'heatmap-rect')
            .attr('x', function(d) { return xScale(d.x) })
            .attr('y', function(d) { return yScale(d.y) })
            .attr('width', width / dimension[0])
            .attr('height', height / dimension[1])
            .attr('fill', function(d) {
                return color(d[score_type]);
            })
            .style('opacity', 1)
            .style('stroke', 'none');
    }
}