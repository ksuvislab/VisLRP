import $ from 'jquery';
import * as d3 from 'd3';
import * as main from '..';
import * as lrp from '../lrp';

var currentSegmentId = 0;
export var segmentColors = ['#fbb4ae','#b3cde3','#ccebc5','#decbe4','#fed9a6','#ffffcc','#e5d8bd','#fddaec','#f2f2f2'];
//['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f'];

export default function(divId, segmentData) {

    let segmentContainer = $('#' + divId);

    segmentContainer.empty();


    for (let i = 0; i < segmentData.length; ++i) {

        let segmentRow = $('<div/>', { class: 'segment-rows' }).css({
            width: 'auto',
            height: '30px',
            // Highligh last segment as default
            'color': '#000', //(i !== currentSegmentId) ? '#000': '#fff',
            'background-color': segmentColors[i], //(i !== currentSegmentId) ? segmentColors[i]: '#1666ba',
            'box-sizing': 'border-box',
            'font-size': '16px',
            'text-align': 'center',
            'cursor': 'pointer',
            'margin-right': '2px',
            'padding': '5px',
            'float': 'left',
            'border': (i !== currentSegmentId) ? 'none' : '1px solid #000'

        }).html('Segment ' + (i + 1));
        segmentContainer.append(segmentRow);

        segmentRow.on('click', function(e) {
            e.stopPropagation();
            $('.segment-rows').css({ 'border': 'none' });
            highlightModel(i);
            setCurrentSegmentId(i);
            // Current segment
            segmentRow.css({ 'border': '1px solid #000' });

            // Update configuration according to segments
            if (main.getLrpCurrentSaveData()) {
                let lrpCurrentSaveData = main.getLrpCurrentSaveData();
                main.visualize(lrpCurrentSaveData);
                //lrp.updateConfiguration(lrpCurrentSaveData);
            } else {
                let lrpCurrentData = main.getLrpCurrentData();
                main.visualize(lrpCurrentData);
                //lrp.updateConfiguration(lrpCurrentData);
            }

            //main.initLRP();

            //lrp.updateIntermediateLayers();
            //lrp.updateImages();
        });
    }

    // Add segment button
    addSegmentButton(segmentData);
    highlightModel(currentSegmentId);
    //highlightModel(currentSegmentId);

    return;
}


function addSegment(data) {
    // Set data
    if (data.length > 0) {
        if (data[data.length - 1].x0 === 38) {
            alert('Error, new segment cannot be overlap');
        } else {
            main.addSegmentToCurrentData();
        }
    }
}

function addSegmentButton(data) {
    let container = $('#lrp-segments-button');
    container.empty();

    let addButton = $('<button/>').css({
        width: '100%',
        height: '100%',
        'border': 'none',
        'outline': 'none',
        'font-size': '16px',
        'cursor': 'pointer',
        'background-color': '#000',
        'color': '#fff'
    }).html('<i class="fas fa-plus"></i>');

    container.css({ 'text-align': 'center' });
    container.append(addButton);

    addButton.off().on('click', function(e) {
        e.stopPropagation();
        addSegment(data);
    });
}

export function highlightModel(brushId) {
    // Reset all selection

    for (var i = 0; i < segmentColors.length; ++i) {
        d3.select('#brush-' + i).selectAll('.selection')
            .style('stroke', '#f0f0f0')
            .style('stroke-width', '0px')
            .style('fill', segmentColors[i])
            .style('opacity', 1);
    }

    // Highlight last segment as selection

    d3.select('#brush-' + brushId).selectAll('.selection')
        .style('stroke', '#000')
        .style('stroke-width', '2px')
        .style('opacity', 1);

    /*
    d3.selectAll('.brush').selectAll('.selection')
        .style('stroke', '#d9d9d9')
        .style('stroke-width', '1px');

    var selection = d3.select('#brush-' + brushId).selectAll('.selection')
                    .style('stroke', 'red')
                    .style('z-index', 1000)
                    .style('stroke-width', '2px');*/

    return;
}

export function highlighSegment(brushId) {
    // Reset all selection

    for (var i = 0; i < segmentColors.length; ++i) {
        d3.select('#brush-' + i).selectAll('.selection')
            .style('stroke', '#f0f0f0')
            .style('stroke-width', '0px')
            .style('fill', segmentColors[i])
            .style('opacity', 1);
    }

    // Highlight last segment as selection
    d3.select('#brush-' + brushId).selectAll('.selection')
        .style('stroke', '#252525')
        .style('stroke-width', '2px')
        .style('opacity', 1);

    return;
}



export function setCurrentSegmentId(id) {
    return currentSegmentId = id;
}

export function getCurrentSegmentId() {
    return currentSegmentId;
}

// Draw tree map
