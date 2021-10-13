import $ from 'jquery';
import * as d3 from 'd3';
import * as main from '../index'
import * as lrp from '.';

// Set first selection as 0 by default
let top_selection = 0;
let top_ids = [];

export default function(containerId, data, isOriginal, bar_color)
{
    data = data.sort(function(a,b) {
        return d3.ascending(parseFloat(a.score), parseFloat(b.score))
    });

    // Set top class index as default
    let classIndex = parseInt(data[data.length - 1]['id']);
    main.setTargetClass(classIndex);

    let container = $('#' + containerId);
    container.empty();

    let margin = { top: 30, right: 0, bottom: 20, left: 0 };
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
            $('#lrp-output-title').html('LRP RELEVANCE HEATMAP TO CLASS<br/>\"' + d.names + '\"');
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


export function reset_top_selection()
{
    top_ids = [];
    return top_selection = 0;
}

export function set_top_selection(index)
{
    top_ids = [];
    return top_selection = index;
}