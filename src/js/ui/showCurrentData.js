import $ from 'jquery';
import * as main from '..';
import * as utils from '../utils';
import { segmentColors } from '../lrp/listSegments';

let saveDataContainer = $('#save-list-container');

var lrp_methods = {
    'customize': 'custom',
    '0': '0',
    'epsilon': '&#949;',
    'gamma': '&#947;',
    'alpha-beta': '&#945;&#946;',
    'alpha1-beta0': '&#945;<sub>1</sub>&#946;<sub>0</sub>',
    'w_square': 'w<sup>2</sup>',
    'flat': 'flat',
    'z-beta': 'z&#946;'
}

export default function(lrpData)
{

    // Clear previous lrp model
    clear_current_model();

    let current_item = $('<div/>', {
        id: 'current-lrp-model',
        class: 'save-items'
    }).css({
        width: '100%', height: 'auto',
        'box-sizing': 'border-box',
        'margin-bottom': '2px',
        'cursor': 'pointer',
        'background-color': '#fff',
        'border': '2px solid #000'
    });

    // Creat header
    let nameHeader = $('<div/>').css({
        width: '100%', height: '30px',
        'line-height': '30px',
        'overflow': 'hidden',
        'font-size': '14px',
        'background-color': '#1666ba',
        'color': '#fff',
        'text-align': 'center',
        'padding-left': '5px',
        'box-sizing': 'border-box'
    }).html(main.getCurrentSaveName());

    // No remove button
    let content = 'Total Segments: ' + lrpData.length + '<br/>';

    let saveBody = $('<div/>').css({
        width: '100%', height: 'auto',
        'font-size': '12px',
        'box-sizing': 'border-box',
        'padding': '2px',
        'text-align': 'left',
    }).html(content);

    let segmentIndex = 0;
    lrpData.forEach(function(segment) {

        let x0 = (segmentIndex === 0) ? segment.x0 : segment.x0 - 1;
        let x1 = (segmentIndex === lrpData.length - 1) ? segment.x1 - 1 : segment.x1 - 2;

        let methodStr = "<font style='float: left; color: #000;'>" + x0 + '</font>' + 'LRP-' + lrp_methods[segment.method[0]] + "<font style='float: right; color: #000;'>" + x1 + "</font>";

        let methodRow = $('<div/>').css({
            width: '100%', height: '16px',
            'line-height': '16px',
            'font-size': '12px',
            'box-sizing': 'border-box',
            'text-align': 'center',
            'margin-bottom': '1px',
            'background-color': segmentColors[segmentIndex],
            'color': '#000',
            'border': '1px solid #fff'
        }).html(methodStr);
        saveBody.append(methodRow);
        segmentIndex++;
    });

    current_item.append(nameHeader);
    current_item.append(saveBody);
    saveDataContainer.prepend(current_item);
    return;
}

// Reset current model
function clear_current_model()
{
    return $('#current-lrp-model').remove();
}