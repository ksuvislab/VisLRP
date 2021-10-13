import * as d3 from 'd3';
import $ from 'jquery';
import { get_node_list } from "./nodelist";
import gallery from './gallery';

export default function(layer_id, data)
{
    let nodes = get_node_list();
    let selected_node = nodes[layer_id];

    reset();

    // Add all selected node numbers
    $('#layer-list-' + layer_id).html('Layer ' + layer_id);//' (' + selected_node.length + '/' + Object.keys(data[layer_id]).length + ')');

    for (let i = 0; i < selected_node.length; ++i) {
        let node_id = selected_node[i];
        // Heatmap interaction
        d3.select('#heatmap-rect-positive-' + node_id)
            .style('opacity', 1)
            .style('stroke-width', 2)
            .style('stroke', '#000')
            .classed('select', true);

        d3.select('#heatmap-rect-negative-' + node_id)
            .style('opacity', 1)
            .style('stroke-width', 2)
            .style('stroke', '#000')
            .classed('select', true);
        // Distribution interaction
        d3.selectAll('.node-relevance_sum_positive-' + node_id)
            .style('fill', '#addd8e')
            .style('opacity', 1)
            .style('stroke', '#000')
            .moveToFront();
        d3.selectAll('.node-relevance_sum_negative-' + node_id)
            .style('fill', '#fc9272')
            .style('opacity', 1)
            .style('stroke', '#000')
            .moveToFront();
        d3.selectAll('.node-activation_sum-' + node_id)
            .style('fill', '#368ce7')
            .style('opacity', 1)
            .style('stroke', '#000')
            .moveToFront();

        let x_positive = parseFloat(d3.select('#heatmap-rect-positive-' + node_id).attr('x'));
        let y_positive = parseFloat(d3.select('#heatmap-rect-positive-' + node_id).attr('y'));
        let width_positive = parseFloat(d3.select('#heatmap-rect-positive-' + node_id).attr('width')) / 2;
        let height_positive = (parseFloat(d3.select('#heatmap-rect-positive-' + node_id).attr('height')) / 2) + 4;

        let rectPositive = d3.select('#heatmap-rect-positive-' + node_id);
        let gRectPositive = rectPositive.select(function() {
            return this.parentNode;
        });

        gRectPositive.append('text')
            .attr('class', 'heatmap-text')
            .attr('x', x_positive + width_positive)
            .attr('y', y_positive + height_positive)
            .style('text-anchor', 'middle')
            .attr('font-size', 12)
            .attr('fill', 'yellow')
            .text(node_id);

        let x_negative = parseFloat(d3.select('#heatmap-rect-negative-' + node_id).attr('x'));
        let y_negative = parseFloat(d3.select('#heatmap-rect-negative-' + node_id).attr('y'));
        let width_negative = parseFloat(d3.select('#heatmap-rect-negative-' + node_id).attr('width')) / 2;
        let height_negative = (parseFloat(d3.select('#heatmap-rect-negative-' + node_id).attr('height')) / 2) + 4;

        let rectNegative = d3.select('#heatmap-rect-negative-' + node_id);
        let gRectNegative = rectNegative.select(function() {
            return this.parentNode;
        });

        gRectNegative.append('text')
            .attr('class', 'heatmap-text')
            .attr('x', x_negative + width_negative)
            .attr('y', y_negative + height_negative)
            .style('text-anchor', 'middle')
            .attr('font-size', 12)
            .attr('fill', 'yellow')
            .text(node_id);
    }

    if (selected_node.length > 0) {
        gallery(selected_node, layer_id);
    } else {
        $('#ablate-gallery-body').empty();
    }

    return;
}

function reset()
{
    // Reset heatmap rect
    d3.selectAll('.heatmap-rect')
        .style('opacity', 0.7)
        .style('stroke', 'none')
        .classed('select', false);

    // Reset distribution dots
    d3.selectAll('.dots').style('fill', '#d9d9d9')
        .style('opacity', 0.5)
        .style('stroke', 'none');

    d3.selectAll('.heatmap-text').remove();

    // Reset gallery
}