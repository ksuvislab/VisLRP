import $ from 'jquery';
import * as main from '..';
import * as utils from '../utils';
import { segmentColors } from '../lrp/listSegments';
import { addConfiguration } from '../ui/compareBtn';

// Container and data index
let saveDataContainer = $('#save-list-container');
let saveDataIndex = -1;
let isComparison = false;

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

// List save data
export default function(saveData)
{
    // Clear container
    saveDataContainer.empty();
    saveDataIndex = -1;

    for (let i = 0; i < saveData.length; ++i) {

        // Create save item
        let saveItem = $('<div/>', {
            class: 'save-items'
        }).css({
            width: '100%', height: 'auto',
            'box-sizing': 'border-box',
            'margin-bottom': '2px',
            'cursor': 'pointer',
            'background-color': '#fff',
            'border': '1px solid #368ce7'
        });

        // Create header
        let nameHeader = $('<div/>').css({
            width: '100%', height: '30px',
            'line-height': '30px',
            'overflow': 'hidden',
            'font-size': '14px',
            'background-color': '#368ce7',
            'color': '#fff',
            'text-align': 'left',
            'padding-left': '5px',
            'box-sizing': 'border-box'
        }).html(saveData[i].name);

        // Create remove button
        let removeButton = $('<button/>').css({
            width: '30px', height: '30px',
            'font-size': '20px',
            'border': 'none', 'outline': 'none',
            'background-color': 'transparent',
            'color': '#fff',
            'float': 'right',
            'cursor': 'pointer'
        }).html('<i class="fas fa-trash-alt"></i>');

        // Create save body
        let saveStr = 'Date: ' + saveData[i].date + '<br/>' +
            'Time: ' + saveData[i].time + '<br/>' +
            'Total Segments: ' + saveData[i].configuration.length + '<br/>';

        let saveBody = $('<div/>').css({
            width: '100%', height: 'auto',
            'font-size': '12px',
            'box-sizing': 'border-box',
            'padding': '2px',
            'text-align': 'left',
        }).html(saveStr);

        // Show all methods with layers
        let segmentIndex = 0;
        saveData[i].configuration.forEach(function(segment) {

            let x0 = (segmentIndex === 0) ? segment.x0 : segment.x0 - 1;
            let x1 = (segmentIndex === saveData[i].configuration.length - 1) ? segment.x1 - 1 : segment.x1 - 2;

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

        // Add everything
        nameHeader.append(removeButton);
        saveItem.append(nameHeader);
        saveItem.append(saveBody);
        saveDataContainer.append(saveItem);

        // Select save item
        saveItem.on('click', function() {

            $('.save-items').css({ 'border': '1px solid #368ce7' });
            saveItem.css({ 'border': '2px solid #000' });

            if (isComparison) {
                addConfiguration(saveData[i]);
            } else {

                saveDataIndex = i;
                let savename = saveData[i].name;
                main.setCurrentSaveName(savename);
                main.setLrpCurrentSaveData(saveData[i].configuration);
                main.start();

            }
        });

        // Remove button events
        removeButton.on('click', function(e) {
            e.stopPropagation();
            let filename = saveData[i].date + '_' + saveData[i].time + '.json';
            if (i !== saveDataIndex) {
                utils.deleteFile(filename).then(function() {
                    saveItem.remove();
                });
            } else {
                utils.deleteFile(filename).then(function() {
                    saveItem.remove();
                    saveDataIndex = -1;

                    // Reset save file
                    main.setLrpCurrentSaveData(undefined);
                    main.setLrpCurrentData(undefined);
                    main.start();
                });
            }
        });
    }

    return;
}

export function enableComparison() {
    isComparison = true;
}

export function disableComparison() {
    isComparison = false;
}