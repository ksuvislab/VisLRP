import * as d3 from 'd3';
import $ from 'jquery';
import gallery from './gallery';
import interaction from './interaction';
import { add_node } from './nodelist';

let container = $('#ablate-distribution-body');

export default function(data, layer_id)
{
    container.empty();
    $('.layer-analysis-container').remove();

    // Need to add multiple tab here

    let layer_container = $('<div/>', {
        id: 'layer-analysis-container'
    }).css({
        width: '100%',
        height: '100%',
        'box-sizing': 'border-box',
        'float': 'left',
        'background-color': '#fff',
        //'border': '1px solid #000',
        'text-align': 'center',
        'font-size': '16px',
        'padding': '5px'
    }).html('Layer: ' + layer_id);

    let node_container = $('<div/>', {
        id: 'node-analysis-container'
    }).css({
        width: '100%',
        height: '100%',
        'box-sizing': 'border-box',
        'float': 'left',
        'background-color': '#fff',
        //'border': '1px solid #000',
        'text-align': 'center',
        'font-size': '14px'
    });

    container.append(layer_container);
    container.append(node_container);

    let layer_data = data[layer_id];
    console.log(layer_data);

    // Score types
    let score_types = ['relevance_sum_positive', 'relevance_sum_negative', 'activation_sum'];
    let score_labels = ['Relevance (+)', 'Relevance (-)', 'Activation'];
    let score_colors = ['#addd8e','#fc9272','#368ce7'];

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
            .style('font-size', '14px')
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
            .style('font-size', '12px')
            .attr('transform', 'translate(0,' + (y.bandwidth() * 2) + ')')
            .selectAll('text')
                .attr('transform', 'rotate(-45)');

        svg.select('.domain').remove();

        let jitter_width = 40;
        let dots = svg.selectAll('score-dot-' + i)
            .data(score_data)
            .enter()
            .append('circle')
            .attr('r', 4)
            .attr('class', function(d) {
                return 'dots node-' + score_types[score_labels.indexOf(d.label)] + '-' + d.id;
            })
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
            return;
            /*
            if (d3.event.selection != null) {
                let brush_coords = d3.brushSelection(this);
                dots.filter(function() {
                    let cx = d3.select(this).attr('cx'),
                        cy = d3.select(this).attr('cy');
                    return isBrushed(brush_coords, cx, cy);
                }).attr('class', function(d) {
                    // Add node id to this
                    add_node(layer_id, d.id);
                    interaction(layer_id, data);

                    return 'dots node-' + score_types[score_labels.indexOf(d.label)] + '-' + d.id;
                });
            }*/
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

            dots.filter(function() {
                let cx = d3.select(this).attr('cx'),
                    cy = d3.select(this).attr('cy');
                return isBrushed(brush_coords, cx, cy);
            }).attr('class', function(d) {
                // Add node id to this
                add_node(layer_id, d.id);
                return 'dots node-' + score_types[score_labels.indexOf(d.label)] + '-' + d.id;
            });

            interaction(layer_id, data);
        }


        function isBrushed(brush_coords, cx, cy) {

            var x0 = brush_coords[0][0],
                x1 = brush_coords[1][0],
                y0 = brush_coords[0][1],
                y1 = brush_coords[1][1];

           return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
       }
    }
}