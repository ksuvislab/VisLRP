import $ from 'jquery';
import path from 'path';
import * as main from '..';
import { byHeatmapImage } from '.';
import { ablatePredict, drawBarChart } from '../lrp';

var ablateContainer = $('#lrp-ablate-container')
var maskContainer = $('#lrp-ablate-mask')
var predictionContainer = $('#lrp-ablate-prediction')
var heatmapContainer = $('#lrp-ablate-heatmap')

var tresholdSlider = $('#lrp-ablate-treshold');
var heatmapButton = $('#lrp-ablate-heatmap-button');
var brushButton = $('#lrp-ablate-brush-button');
var closeButton = $('#lrp-ablate-close');
var classifyButton = $('#lrp-ablate-classify');

var mode = "heatmap";

export default function(segment)
{
    $('#lrp-ablate-prediction2').empty();
    $('#lrp-ablate-prediction2').append($('#lrp-result-class-input').clone());

    maskContainer.empty();
    heatmapContainer.empty();

    var inputImagePath = main.getInputImagePath();
    var heatmapImagePath = path.join(__dirname, '..', '..', '..', 'intermediate_images', 'intermediate_images_' + (segment.x0 - 1) + '.png');

    let maskImage = $('<img/>', {
        alt: '',
        src: inputImagePath
    }).css({ width: '100%', height: '100%' });
    maskContainer.append(maskImage);

    let heatmapImage = $('<img/>', {
        alt: '',
        src: heatmapImagePath
    }).css({ width: '100%', height: '100%' });
    heatmapContainer.append(heatmapImage);

    // Close button events
    closeButton.off().on('click', function() {
        $('.segment-images').removeClass('active');
        ablateContainer.width(0);
    });

    heatmapButton.off().on('click', function() {
        tresholdSlider.show();
        mode = 'heatmap';
    });

    brushButton.off().on('click', function() {
        tresholdSlider.hide();
        mode = 'brush';
    });

    classifyButton.off().on('click', function() {
        if (mode === 'heatmap') {
            byHeatmapImage(segment.x0 - 1, tresholdSlider.val());
            maskContainer.empty();
            let newImagee = $('<img/>', {
                alt: '',
                src: path.join(__dirname, '..', '..', '..', 'images_ablated','output_ablated.png')
            }).css({ width: '100%', height: '100%' });
            maskContainer.append(newImagee);

            ablatePredict().then(function(result) {
                drawBarChart('lrp-ablate-prediction', result);
            });

        } else {

        }
    });

    tresholdSlider.off().on('input', function() {
        $('#lrp-ablate-text').html('Threshold: ' + tresholdSlider.val());
    });

}