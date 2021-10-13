import $ from 'jquery';
import * as d3 from 'd3';
import path from 'path';
import * as main from '..';
import * as ablate from '../ablate';
import { segmentColors, highlightModel, highlighSegment, setCurrentSegmentId, getCurrentSegmentId } from './listSegments';
import { updateEquation, updateConfiguration } from '.';

var intermediateContainer = $('#lrp-segments-intermediate');
let directoryPath = path.join(__dirname, '..', '..', '..', 'intermediate_images');

let currentSegmentRow = -1;
let currentSegmentAblate = -1;

export default function() {

    let segmentData = (main.getLrpCurrentSaveData()) ? main.getLrpCurrentSaveData() : main.getLrpCurrentData();

    intermediateContainer.empty();
    let globalHeight = intermediateContainer.height();
    let staticHeight = 200;
    let height = 0;

    if (staticHeight * segmentData.length > globalHeight) {
        height = globalHeight / segmentData.length;
    } else {
        height = staticHeight;
    }

    //console.log(main.getCurrentSaveName());
    // Set current save name
    $('#views-lrp-segments-header1').html(main.getCurrentSaveName());

    // Calculate all height
    let segmentRow = $('<div/>').css({
        width: '100%',
        height: height * segmentData.length,
        'box-sizing': 'border-box',
        'background-color': '#fff',
        margin: 'auto',
        position: 'absolute',
        top: -20, left: 0, bottom: 0, right: 0
    });

    intermediateContainer.append(segmentRow);


    for (let i = 0; i < segmentData.length; ++i) {

        // Calculate all height
        let segmentItem = $('<div/>').css({
            width: '100%',
            height: height + 'px',
            'box-sizing': 'border-box',
            'background-color': segmentColors[i],
            'border': '1px solid #fff'
        });

        segmentRow.append(segmentItem);

        let imageContainer = $('<div/>', {
            class: 'segment-images'
        }).css({
            width: height + 'px',
            height: '100%',
            'box-sizing': 'border-box',
            float: 'right',
            'background-color': '#d9d9d9',
            'border': '1px solid #fff'
        });

        let visContainer = $('<div/>', {
            id: 'segment-vis-' + segmentData[i].id,
            class: 'segments-vis'
        }).css({
            width: 'calc( 100% - ' + height + 'px)',
            height: '100%',
            'box-sizing': 'border-box',
            float: 'right',
            'background-color': 'rgba(255,255,255, 0.4)',
            'border': (segmentData[i].id === getCurrentSegmentId()) ? '2px solid #000' : '2px solid #fff',
            'cursor': 'pointer'
        });

        segmentItem.append(imageContainer);
        //segmentItem.append(formulaContainer);
        segmentItem.append(visContainer);

        let image = $('<img/>', {
            id: 'intermediate-images-' + segmentData[i].id,
            alt: '',
            src: ''
        }).css({ width: '100%', height: '100%' });

        imageContainer.append(image);
        imageContainer.on('click', function() {
            //lrp-ablate-container
            if (currentSegmentAblate !== segmentData[i].id) {
                $('.segment-images').removeClass('active');
                $('#lrp-ablate-container').width(0);
                //$('.segments-vis').css({ 'border': '2px solid #fff' });
                //$('#lrp-segments-settings').width(0);
            }

            imageContainer.toggleClass('active');

            // Toggle active segments
            if (imageContainer.hasClass('active')) {
                // Show settings
                $('#lrp-ablate-container').width('100%');
                ablate.initialize(segmentData[i]);
                currentSegmentAblate = segmentData[i].id;

            } else {
                // Hide settings
                $('#lrp-ablate-container').width(0);
                currentSegmentAblate = -1;
            }

        });


        let formulaContainer = $('<div/>', {
            id: 'formula-' + segmentData[i].id
        }).css({
            width: '100%',
            height: '60px',
            'box-sizing': 'border-box',
            'font-size': '14px',
            'padding-top': '12px',
            'text-align': 'center',
            'overflow': 'hidden',
            'background-color': 'rgba(255,255,255,0.5)'
            //'border-bottom': '1px dashed #000'
        });

        let parameterContainer = $('<div/>', {
            id: 'formula-bar-' + segmentData[i].id
        }).css({
            width: '100%',
            height: 'calc(100% - 60px)',
            'box-sizing': 'border-box',
            'font-size': '10px',
            'text-align': 'center',
        });

        visContainer.append(formulaContainer);
        visContainer.append(parameterContainer);

        updateEquation(formulaContainer, segmentData[i]);
        drawVerticalBarChart(parameterContainer, segmentData[i]);

        visContainer.on('click', function() {
            if (currentSegmentRow !== segmentData[i].id) {
                $('.segments-vis').removeClass('active');
                $('.segments-vis').css({ 'border': '2px solid #fff' });
            }

            visContainer.toggleClass('active');

            // Toggle active segments
            if (visContainer.hasClass('active')) {
                $('#treemap-container-' + segmentData[i].id).css({ 'border': '2px solid #000' });
                $('#segment-vis-' + segmentData[i].id).css({ 'border': '2px solid #000' });
                currentSegmentRow = segmentData[i].id;
                highlighSegment(i);

                // Have current segment here
                setCurrentSegmentId(segmentData[i].id);
                //updateConfiguration(segmentData);
                //updateEquation(formulaContainer, segmentData[i]);
                main.visualize(segmentData);

            } else {
                $('.treemap-containers').css({ 'border': '2px solid #fff' });
                $('.segments-vis').css({ 'border': '2px solid #fff' });
                currentSegmentRow = -1;
                highlighSegment(-1);
            }
        });
    }

    return;
}

function drawVerticalBarChart(container, brush) {

    //var container = $('#treemap-container-' + brush.id);
    container.empty();

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

    var parameterSymbols = [];
    //var parameterNames = [];
    Object.keys(parameters).forEach(function(param) {
        parameterSymbols.push(param);
        //parameterNames.push(param);
    });

    var margin = {top: 40, right: 2, bottom: 20, left: 2},
        width = container.width() - margin.left - margin.right,
        height = container.height() - margin.top - margin.bottom;

    var color = d3.scaleOrdinal()
        .domain(parameterSymbols)
        .range(['#8dd3c7','#8dd3c7','#ffffb3','#ffffb3','#ffffb3','#ffffb3','#ffffb3','#fb8072','#bebada','#bebada']);

    var x = d3.scaleBand()
        .domain(parameterSymbols)
        .padding(0.5)
        .rangeRound([0, width]);

    var y = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

    var svg = d3.select('#' + container.attr('id')).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .selectAll('g')
        .data(parameterSymbols)
        .enter();

    var xAxis = d3.axisBottom()
        .ticks()
        .scale(x)
        .tickFormat(function(d) { return null });


    svg.append("g")
        .attr("class", "x parameter-axis")
        .attr("transform", "translate(0,-40)")
        .call(xAxis)
        .selectAll('g')
        .append("svg:foreignObject")
        .attr('width', 12)
        .attr('height', 10)
        .attr('x', 0)
        .attr('y', 7)
        .append("xhtml:div")
        .attr("class", "my-x-axis-label")
        .html(function(d) { return parameters[d]; });



    svg.selectAll('.rect-bg')
        .data(parameterSymbols)
        .enter()
        .append('rect')
        .attr('class', 'rect-bg')
        .attr('width', width / parameterSymbols.length - 10)
        .attr('x', function(d) { return x(d); })
        .style('stroke', 'none')
        .attr('fill-opacity', "0.1")
        .style('fill', function(d) { return color(d); })
        .attr('y', function(d, i) { return y(1); })
        .attr('height', function(d, i) { return height - y(1); });

    svg.selectAll('.rect-bar')
        .data(parameterSymbols)
        .enter()
        .append('rect')
        .attr('class', 'rect-bar')
        .attr('width', width / parameterSymbols.length - 10)
        .attr('x', function(d) { return x(d); })
        .style('stroke', '#000')
        .style('fill', function(d) { return color(d); })
        .attr('y', function(d, i) { return (brush[d] > 1) ? y(1)  : y(brush[d]); })
        .attr('height', function(d, i) { return (brush[d] > 1) ? height - y(1) : height - y(brush[d]); })


    svg.selectAll('.text-bar-1')
        .data(parameterSymbols)
        .enter()
        .append("text")
        .attr('class', 'text-bar-1')
        .attr('x', function(d) { return x(d) + 17; })
        .attr('y', '-2')
        .text('1')
        .attr("font-size", "10px")
        .attr('text-anchor', 'start')
        .attr("fill", "#252525")

    svg.selectAll('.text-bar-0')
        .data(parameterSymbols)
        .enter()
        .append("text")
        .attr('class', 'text-bar-0')
        .attr('x', function(d) { return x(d) + 17; })
        .attr('y', height + 12)
        .text('0')
        .attr("font-size", "10px")
        .attr('text-anchor', 'start')
        .attr("fill", "#252525")

    svg.selectAll('.text-bar-value')
        .data(parameterSymbols)
        .enter()
        .append("text")
        .attr('class', 'text-bar-value')
        .attr('x', function(d) { return x(d) + 17; })
        .attr('y', function(d, i) { return (brush[d] >= 1) ? y(1) + 10 : y(brush[d]) + 10; })
        .text(function(d, i) { return (brush[d] >= 0.1) ? brush[d].toFixed(1) : '' })
        .attr("font-size", "10px")
        .attr('text-anchor', 'start')
        .attr("fill", "#252525")



    //svg.selectAll('rect')
    //    .transition()
        //.delay(function(d) { return Math.random() * 1000 })
      //  .duration(1000)
        //.attr('y', function(d) { return y(brush[d]); })
        //.attr('height', function(d) { return height - y(brush[d]); })

    return;
}