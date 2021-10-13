import $ from 'jquery';
import * as d3 from 'd3';
import * as lrp from '.';
import * as utils from '../utils/';

let scoreHeader = $('#lrp-intermediate-score-header');
let scoreContainer = $('#lrp-intermediate-score');
let flipButton = $('#lrp-flip-button');
let nodeList = {};

export default function(layerIndex, intermediateData, filterData) 
{

    // Highlight images
    $('.intermediate-images').css({ border: 'none' });
    $('#intermediate-image-' + layerIndex).css({ border: '5px solid #000' });

    // Get layer data
    var data = intermediateData.filter(obj => {
        return obj.layer === layerIndex;
    });

    let layerData = data[0].data;

    let activationSums = [],
        relevanceAbsolutes = [],
        relevanceCombinations = [],
        relevancePositives = [],
        relevanceNegatives = [];

    Object.keys(layerData).forEach(function(node) {
        activationSums.push(layerData[node]['activation_sum']);
        relevanceAbsolutes.push(layerData[node]['relevance_sum_absolute']);
        relevanceCombinations.push(layerData[node]['relevance_sum_combination']);
        relevancePositives.push(layerData[node]['relevance_sum_positive']);
        relevanceNegatives.push(layerData[node]['relevance_sum_negative']);
    });

    // Color mapping
    let squareDim = 70;
    var activationColor = d3.scaleSequential(d3.interpolateReds)
        .domain([d3.min(activationSums), d3.max(activationSums)]);
    var relevanceCombineColor = d3.scaleSequential(d3.interpolateGreys)
        .domain([d3.min(relevanceAbsolutes), d3.max(relevanceAbsolutes)]);
    var relevancePosColor = d3.scaleSequential(d3.interpolateBlues)
        .domain([d3.min(relevancePositives), d3.max(relevancePositives)]);

    var relevanceNegColor = d3.scaleSequential(d3.interpolateGreens)
    .domain([d3.min(relevanceNegatives), d3.max(relevanceNegatives)]);

    // Color mapping
    /*
    var logScale = d3.scaleLog().domain([d3.min(relevanceNegatives), d3.max(relevanceNegatives)]);
    var relevanceNegColor = d3.scaleSequential((d) => d3.interpolateGreens(logScale(d)))*/

    let nodeLength = Object.keys(layerData).length;
    let dimension = utils.getNodeDimensions(nodeLength);
    let containerSize = utils.getNodeContainers(nodeLength);

    // Get node dimensions
    let row = dimension[0];
    let col = dimension[1];
    let containerWidth = containerSize[1];
    let containerHeight = containerSize[0];
    
    // Remove previous square
    $('#square-nodes-' + layerIndex).remove();

    var mainContainer = $('<div/>', {
        id: 'square-nodes-' + layerIndex,
        class: 'square-nodes'
    }).css({
        width: containerWidth + 'px',
        height: containerHeight + 30 + 'px',
        'box-sizing': 'border-box',
        float: 'left',
        cursor: 'pointer',
        'padding': '5px'
    });

    $('.square-header').css({ 'background-color': '#fff', 'color': '#000' });
    var layerHeader = $('<div/>',{
        id: 'square-header-' + layerIndex,
        class: 'square-header'
    }).css({
        width: '100%',
        height: 20 + 'px',
        'line-height': 20 + 'px',
        'box-sizing': 'border-box',
        float: 'left',
        'font-size': '12px',
        'text-align': 'left',
        'background-color': '#368ce7', 
        'color': '#fff',
        cursor: 'pointer',
        'padding-left': '5px' 
    }).html('Layer: ' + layerIndex);

    $('.square-container').css({ 'border': 'none'});
    var layerContainer = $('<div/>', {
        id: 'square-container-' + layerIndex,
        class: 'square-container'
    }).css({
        width: '100%',
        height: 'calc(100% - 20px',
        'box-sizing': 'border-box',
        'border': '1px solid #368ce7',
        float: 'left',
        cursor: 'pointer',
        'background-color': '#9d9d9d'
    });

    mainContainer.append(layerHeader);
    mainContainer.append(layerContainer);
    scoreContainer.prepend(mainContainer);

    layerHeader.on('click', function() {
        $('.square-container').css({ 'border': 'none'});
        $('.square-header').css({ 'background-color': '#fff', 'color': '#000' });
        $('#square-container-' + layerIndex).css({ 'border': '1px solid #368ce7'});
        // Highlight images
        $('.intermediate-images').css({ border: 'none' });
        $('#intermediate-image-' + layerIndex).css({ border: '5px solid #000' });
        layerHeader.css({ 'background-color': '#368ce7', 'color': '#fff' });
        // Do something here
        lrp.drawScoreHistogram(layerIndex,'activation_sum', intermediateData);
    })

    let nodeWidth = layerContainer.width() / col;
    let nodeHeight = layerContainer.height() / row;
    let innerWidth = nodeWidth - nodeWidth/2;
    let innerHeight = nodeHeight - nodeWidth/2; 

    Object.keys(layerData).forEach(function(node) {

        let nodeData = layerData[node];

        let nodeContainer = $('<div/>', {
            id: node,
            class: 'layer-nodes'
        }).css({
            'box-sizing': 'border-box',
            'width': nodeWidth,
            'height': nodeHeight,
            'float': 'left',
            'cursor': 'pointer'
        });

        layerContainer.append(nodeContainer);
        
        var svg = d3.select('#' + nodeContainer.attr('id')).append('svg')
            .attr('width', nodeWidth)
            .attr('height', nodeHeight)
            .append('g')
            .attr('id',  'node-' + layerIndex + '-' + node)
            .attr('class', 'node-rect')
            .style('opacity', 1)
            .on('click', function() {

                // Toggle class
                nodeContainer.toggleClass('toggled');

                if (nodeContainer.hasClass('toggled')) {
                    nodeContainer.css( {border: '2px solid #000'} );
                    lrp.drawHeatmap(nodeData, node.split('_')[1], layerIndex);
                } else {
                    nodeContainer.css({ border: 'none' });
                }
            });

        svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            //.transition().delay(100)
            .attr('width', nodeWidth)
            .attr('height', nodeHeight)
            .style('fill', activationColor(nodeData['activation_sum']));

        // positive
        
        svg.append('rect')
            .attr('x', (nodeWidth/2) - (innerWidth/2))
            .attr('y', (nodeHeight/2) - (innerHeight/2))
            //.transition().delay(100)
            .attr('width', (innerWidth / 2))
            .attr('height', innerHeight)
            .style('fill', relevancePosColor(nodeData['relevance_sum_positive']));

        // negative
        svg.append('rect')
            .attr('x', (nodeWidth/2))
            .attr('y', (nodeHeight/2) - (innerHeight/2))
            //.transition().delay(100)
            .attr('width', innerWidth / 2)
            .attr('height', innerHeight)
            .style('fill', relevanceNegColor(nodeData['relevance_sum_negative']));
    });
    
    /*
    activationSums.push(layerData[node]['activation_sum']);
        relevanceAbsolutes.push(layerData[node]['relevance_sum_absolute']);
        relevanceCombinations.push(layerData[node]['relevance_sum_combination']);
        relevancePositives.push(layerData[node]['relevance_sum_positive']);
        relevanceNegatives.push(layerData[node]['relevance_sum_negative']);*/
   

    /*
    Object.keys(layerData).forEach(function(node) {

        if (filterData) {
            if (!(node in filterData)) {
                return;
            }
        }

        let nodeData = layerData[node];
        
        let nodeContainer = $('<div/>', {
            id: node,
            class: 'layer-nodes'
        }).css({
            'box-sizing': 'border-box',
            'width': squareDim,
            'height': squareDim,
            'float': 'left',
            'margin': '1px',
            'cursor': 'pointer',
            'display': 'inline-block'
        }).on('click', function() {

            $('#lrp-flip-container').width('199px');
            scoreContainer.width('calc(100% - 200px)');

            let cloneContainer = nodeContainer.clone(true);
            $('#lrp-flip-nodes').append(cloneContainer);

            let node_index = parseInt(node.split('_')[1]);
            let layer_index = layerIndex 

            if (layer_index in nodeList) {
                nodeList[layer_index].push(node_index);
            } else {
                nodeList[layer_index] = [];
                nodeList[layer_index].push(node_index);
            }

            // Add node here
            cloneContainer.off().on('click', function() {
                // Slice that and  find it to remove from the list
                cloneContainer.remove();
            });


            //nodeContainer.toggleClass('toggled');
            /*
            if (nodeContainer.hasClass('toggled')) {
                // Re-add toggled class
                $('.layer-nodes').removeClass('toggled');
                nodeContainer.addClass('toggled');
                // Remove class toggled
                $('#lrp-intermediate-heatmap').height('40%');
                scoreContainer.height('calc(70% - 30px)');
                //showHeatmap(nodeData);
            } else {
                // clear all
                $('#lrp-intermediate-heatmap').height('0px');
                scoreContainer.height('calc(100% - 30px)');
            }*/

        /*
        });

        // Add node container
        scoreContainer.append(nodeContainer);

        var svg = d3.select('#' + nodeContainer.attr('id')).append('svg')
                    .attr('width', squareDim)
                    .attr('height', squareDim);

        svg.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            //.transition().delay(100)
            .attr('width', squareDim)
            .attr('height', squareDim)
            .style('fill', activationColor(nodeData['activation_sum']))
            .style('stroke-width', '10px')
            .style('stroke', activationColor(nodeData['activation_sum']));

        // Relevance absolute
        // Activation and Relavance combination
        let relevnaceDim = relevanceSize(nodeData['relevance_sum_combination']);
        /*
        svg.append('rect')
            .attr('x', (squareDim/2) - (relevnaceDim/2))
            .attr('y', (squareDim/2) - (relevnaceDim/2))
            //.transition().delay(100)
            .attr('width', relevnaceDim)
            .attr('height', relevnaceDim)
            .style('fill', relevanceCombineColor(nodeData['relevance_sum_absolute']));*/
    /*
        //let relevnaceDim = relevanceSize(nodeData['relevance_sum_combination']);
        let innerSquareDim = relevnaceDim;

        // positive
        svg.append('rect')
            .attr('x', (squareDim/2) - (innerSquareDim/2))
            .attr('y', (squareDim/2) - (innerSquareDim/2))
            //.transition().delay(100)
            .attr('width', (innerSquareDim / 2))
            .attr('height', innerSquareDim)
            .style('fill', relevancePosColor(nodeData['relevance_sum_positive']));

        // negative
        svg.append('rect')
            .attr('x', (squareDim/2))
            .attr('y', (squareDim/2) - (innerSquareDim/2))
            //.transition().delay(100)
            .attr('width', innerSquareDim / 2)
            .attr('height', innerSquareDim)
            .style('fill', relevanceNegColor(nodeData['relevance_sum_negative']));
        
        svg.append('text')
            .attr('x', 2)
            .attr('y', squareDim - 12)
            .attr("dy", ".71em")
            .style("text-anchor", "start")
            .attr("font-size", "12px")
            .attr("fill", "#252525")
            .text(node.split('_')[1]);

        /*
        svg.append('text')
            .attr('x', 2)
            .attr('y', 2)
            .attr("dy", ".71em")
            .style("text-anchor", "start")
            .attr("font-size", "12px")
            .attr("fill", "#e41a1c")
            .text(nodeData['activation_sum'].toFixed(2));

        svg.append('text')
            .attr('x', 2)
            .attr('y', 14)
            .attr("dy", ".71em")
            .style("text-anchor", "start")
            .attr("font-size", "12px")
            .attr("fill", "#377eb8")
            .text(nodeData['relevance_sum_positive'].toFixed(2));

        svg.append('text')
            .attr('x', 2)
            .attr('y', 28)
            .attr("dy", ".71em")
            .style("text-anchor", "start")
            .attr("font-size", "12px")
            .attr("fill", "#4daf4a")
            .text(nodeData['relevance_sum_negative'].toFixed(2));
        */
    /*
        nodeContainer.on('mouseover', function() {
            console.log('mouseover');
        });

    });

    flipButton.off().on('click', function() {
        console.log(nodeList);
        //lrp.flipNode('');
    });

    return;
    */
}

export function resetNodeList() {
    return nodeList = {};
}