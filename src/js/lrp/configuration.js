import $ from 'jquery';
import * as main from '..';
import * as lrp from '../lrp';
import { highlighSegment, segmentColors } from './listSegments';

var segmentContainer = $('#lrp-configuration-segments-body');
var presetButton = $('.preset-button');
var stepButtons = $('.configuration-step-buttons');
var settingHeader = $('#setting-header');
var settingContainers = $('.lrp-configuration-settings');
var settingContainer = [    $('#settings-contribution'),
                            $('#settings-activation'),
                            $('#settings-weight'),
                            $('#settings-suppression') ];

var effectColors = ['#bebada','#8dd3c7','#ffffb3','#fb8072'];

var steps = {
    contribution: ['alpha', 'beta'],
    activation: ['theta0', 'theta1'],
    weight: ['gamma0', 'gamma1', 'gamma1p', 'gamma1n', 'gamma2'],
    suppression: ['eps']
}

var inputLabels = {
    'theta0': '&#952;<sub>0</sub>',
    'theta1': '&#952;<sub>1</sub>',
    'gamma0': '&#947;<sub>0</sub>',
    'gamma1': '&#947;<sub>1</sub>',
    'gamma2': '&#947;<sub>2</sub>',
    'gamma1p': '&#947;<sub>1+</sub>',
    'gamma1n': '&#947;<sub>1-</sub>',
    'eps': '&#949;',
    'alpha': '&#945;',
    'beta': '&#946;',
}

export default function(data) {
    resetStepButtons();
    highlightTemplateButton(data);
    initStepButtons();
    updateSettings(data);
    return;
}

function resetStepButtons() {
    //stepButtons.removeClass('active');
    //$('.configuration-step-buttons[name="step1"]').addClass('active');

    // Set steps button colors
    for (let i = 0; i < stepButtons.length; ++i) {
        var title = settingContainer[i].attr('id').split('-')[1].toUpperCase();
        $(stepButtons[i]).html('<i class="fas fa-square-full" style="color:' + effectColors[i] + '; border: 1px solid #000;"></i>&nbsp;&nbsp;' + (i + 1) + '. ' + title + '&nbsp;&nbsp;EFFECT');
        //$(stepButtons[i]).css({ 'background-color': effectColors[i] });
    }

    //settingContainers.removeClass('active');
    //settingContainer[0].addClass('active');

    // Change header title
    //settingHeader.html('CONTRIBUTION EFFECT');
    //settingHeader.css({ 'background-color': effectColors[0] });
    return;
}

function highlightTemplateButton(allSegmentData) {
    let segmentId = lrp.getCurrentSegmentId();
    let method = allSegmentData[segmentId].method[0];


    for (let i = 0; i < presetButton.length; ++i) {
        let button = presetButton[i];

        // Missing this method
        if (method === 'customize' && $(button).val() === 'default') {
            $(button).addClass('active');
        } else if ($(button).val() === method) {
            $(button).addClass('active');
        } else {
            $(button).removeClass('active');
        }
    }

}

// Set step button events
function initStepButtons() {
    stepButtons.each(function(i, obj) {
        $('.configuration-step-buttons[name="step' + (i + 1) + '"]').addClass('active');
        /*
        $(obj).off().on('click', function(e) {
            e.stopPropagation();
            //stepButtons.removeClass('active');

            $('.configuration-step-buttons[name="step' + (i + 1) + '"]').addClass('active');

            //settingContainers.removeClass('active');
            //settingContainer[i].addClass('active');

            // Change header title
            //var title = settingContainer[i].attr('id').split('-')[1].toUpperCase();
            //settingHeader.html(title + ' EFFECT');
            //settingHeader.css({ 'background-color': effectColors[i] });
        });*/
    });
}

export function updateSettings(allSegmentData) {


    let currentSegmentId = lrp.getCurrentSegmentId();
    // console.log(currentSegmentId);
    let data = allSegmentData[currentSegmentId];


    highlighSegment(data.id);
    $('.segments-vis').css({ 'border': '2px solid #fff'});
    $('#segment-vis-' + data.id).css({ 'border': '2px solid #000' });

    Object.keys(steps).forEach(function(item) {
        var container = $("#settings-" + item);

        container.empty();

        // Loop through all inputs
        for (let i = 0; i < steps[item].length; ++i) {
            let inputRow = $('<div/>', { class: 'settings-row' });
            let parameter = steps[item][i];
            let inputValue = data[parameter];

            // Add labels
            let inputLabel = $('<label/>', { class: 'parameters' }).html(inputLabels[parameter]);


            // Add checkboxs
            let checkbox0 = $('<label/>', { class: 'checkbox-container' })
                            .html(0);
            let checkbox1 = $('<label/>', { class: 'checkbox-container' })
                            .html(1);

            let rangeLabel = $('<label/>', {id: parameter + '-range'})
                .css({
                    'position': 'absolute',
                    'right': '1px',
                    'top': '1px'
                })
                .html(parseFloat(inputValue).toFixed(2));
            let checkbox2 = $('<label/>', { class: 'checkbox-container' })
                            .append(rangeLabel);

            // Add all inputs
            let input0 = $('<input/>', { name: parameter, type: 'checkbox', value: 0 });
            let span0 = $('<span/>', { class: 'checkmark' });

            let input1 = $('<input/>', { name: parameter, type: 'checkbox', value: 1 });
            let span1 = $('<span/>', { class: 'checkmark' });

            let input2 = $('<input/>', { name: parameter, type: 'checkbox', value: 2 });
            let span2 = $('<span/>', { class: 'checkmark' });

            // Add everthing togethers
            //checkbox0.append(input0).append(span0);
            //checkbox1.append(input1).append(span1);
            //checkbox2.append(input2).append(span2);
            inputRow.append(inputLabel);
            inputRow.append(rangeLabel);
            //inputRow.append(checkbox0);
            //inputRow.append(checkbox1);
            //inputRow.append(checkbox2);


            console.log(inputValue);

            let min_value = 0.00;
            let max_value = 1.00;

            if (parameter === 'alpha') {
                min_value = 1.00;
                max_value = 4.00;
            } else if (parameter === 'beta') {
                min_value = 0.00;
                max_value = 3.00;
            }

            // Add range slider
            let rangeInput = $('<input/>', {
                class: 'custom-slider',
                type: 'range',
                value: inputValue,
                min: min_value,
                max: max_value,
                step: 0.01
            }).css({ width: 'calc(100% - 50px)' });//.hide();

            inputRow.append(rangeInput);
            container.append(inputRow);
            rangeInput.val(inputValue);

            // Set checkmark base on values
            /*
            if (inputValue !== 1 && inputValue !== 0) {
                input2.prop('checked', true);
                rangeInput.show();
                rangeInput.val(inputValue);
            } else {
                if (inputValue == 0) { input0.prop('checked', true); }
                if (inputValue == 1) { input1.prop('checked', true); }
            }*/

            // Add events for each of checkbox inputs
            /*
            input0.on('change', function() {
                input1.prop('checked', false);
                input2.prop('checked', false);
                rangeInput.hide();
                // Reset range input
                rangeInput.val(0);
                rangeLabel.html('Value: ' + parseFloat(rangeInput.val()).toFixed(2));

                // Set current data
                data[parameter] = 0;
                main.setLrpSpecificData(data);
            });

            input1.on('change', function() {
                input0.prop('checked', false);
                input2.prop('checked', false);
                rangeInput.hide();
                // Reset range input
                rangeInput.val(0);
                rangeLabel.html('Value: ' + parseFloat(rangeInput.val()).toFixed(2));

                // Set current data
                data[parameter] = 1;
                main.setLrpSpecificData(data);
            });

            input2.on('change', function() {
                input0.prop('checked', false);
                input1.prop('checked', false);
                rangeInput.show();
            });*/

            rangeInput.on('input', function() {
                rangeLabel.html(parseFloat(rangeInput.val()).toFixed(2));
                data[parameter] = parseFloat(rangeInput.val());
                lrp.updateEquation($('#formula-' + currentSegmentId), data);
                lrp.updateIntermediate();
                main.setLrpSpecificData(data);
            });
        }

    });

}

/*
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
    highlighSegment(i);*/