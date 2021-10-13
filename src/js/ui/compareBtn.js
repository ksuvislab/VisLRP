import $ from 'jquery';
import { disableComparison, enableComparison } from './listSaveData';
import { getInputImagePath } from '..';
import prediction from '../lrp/prediction';
import * as d3 from 'd3';
import path from 'path';
import { runLrpOnly, updateEquation } from '../lrp';
import { segmentColors } from '../lrp/listSegments';

let compareButton = $('#manager-compare-title');
let managerCompare = $('#manager-compare');
let managerContainer = $('#manager-container');

let compareBody = $('#manager-compare-body');
let compareContainer = $('#lrp-compare-container');

var inputRowData = {};
var configurations = {};
var currentRow = 0;
var allRow = 0;

export default function()
{
    compareButton.off().on('click', function() {
        compareButton.toggleClass('active');
        if (compareButton.hasClass('active')) {
            //managerCompare.height('230px');
            compareContainer.width('100%');
            //managerContainer.height('calc(100% - 230px');
            configurations = {};
            enableComparison();
            start_compare();
        } else {
            //managerCompare.height('30px');
            $('#current-lrp-model').show();
            compareContainer.width('0px');
           // managerContainer.height('calc(100% - 30px');
           disableComparison();
            compareBody.empty();
        }
    });
}

function start_compare() {
    // Show new model
    $('#current-lrp-model').hide();
    initialize();
    return;
}

function initialize() {
    compareContainer.empty();

    var titleContainer = $('<div/>').css({
        width: '100%',
        height: '30px',
        'line-height': '30px',
        'box-sizing': 'border-box',
        'text-align': 'center'
    }).html('MODEL COMPARISON');

    // Create main container
    var mainContainer = $('<div/>', {
        id: 'main-compare'
    }).css({
        width: '100%',
        height: 'calc(100% - 30px)',
        'box-sizing': 'border-box',
        'position': 'relative',
        'background-color': '#d9d9d9',
        'padding': '5px',
        'overflow-y': 'auto',
        'overflow-x': 'hidden',
    });

    compareContainer.append(titleContainer);
    compareContainer.append(mainContainer);

    createRow();
    return;
}

function createRow() {

    let rowId = allRow;
    inputRowData[allRow] = {};
    inputRowData[allRow].image = undefined;
    inputRowData[allRow].target = undefined;

    let row = $('<div/>', {
        id: 'comparison-row-' + rowId,
        class: 'comparison-row'
    }).css({
        'width': '100%',
        'height': '450px',
        'box-sizing': 'border-box',
        'position': 'relativee',
        'background-color': '#fff',
        'margin-bottom': '5px'
    });

    $('#main-compare').append(row);

    row.on('click', function() {
        currentRow = rowId;
        highlightRow();
    });

    highlightRow();
    addRowButton();
    addInputController(row, rowId);
    addConfigContainer(row, rowId);
    updateRow();
    ++allRow;
    return;
}

function highlightRow() {
    $('.comparison-row').css({ 'border': 'none' });
    $('#comparison-row-' + currentRow).css({ 'border': '1px solid #252525' });
    return;
}

function addRowButton() {

    $('#rowbutton-container').remove();

    var rowButtonContainer = $('<div/>', {
        id: 'rowbutton-container'
    }).css({
        width: '100%',
        height: '30px',
        'line-height': '30px',
        'background': '#1666ba',
        'color': '#fff',
        'text-align': 'center',
        'cursor': 'pointer'
    }).html('Add Comparison Row');

    $('#main-compare').append(rowButtonContainer);

    rowButtonContainer.on('click', function() {
        createRow();
    });

    return;
}

function addInputController(container, rowId) {

    let defaultImagePath = getInputImagePath();

    // Add input controller
    let inputContainer = $('<div/>').css({
        'width': '250px',
        'height': '100%',
        'box-sizing': 'border-box',
        'background': '#fff',
        'padding': '2px',
        'float': 'left'
    });

    let inputImageButton = $('<div/>').css({
        'width': '100%',
        'height': '30px',
        'line-height': '30px',
        'background': '#1666ba',
        'color': '#fff',
        'text-align': 'center',
        'position': 'relative',
        'cursor': 'pointer'
    }).html('Select Image');

    let imageInput = $('<input/>', {
        type: 'file'
    }).css({
        opacity: 0,
        position: 'absolute',
        'top': 0,
        'left': 0,
        'width': '100%',
        'height': '100%',
        'cursor': 'pointer'
    });

    // Set default image
    let imageContainer = $('<div/>').css({
        'width': '100%',
        'height': 'calc(55% - 15px)',
        'background': '#252525'
    });

    let targetClassContainer = $('<div/>', {
        id: 'compare-target-' + rowId
    }).css({
        'width': '100%',
        'height': 'calc(45% - 15px)',
        'background': '#fff'
    });

    container.append(inputContainer);
    inputContainer.append(inputImageButton);
    inputContainer.append(imageContainer);
    inputContainer.append(targetClassContainer);
    // Add fileInput
    inputImageButton.append(imageInput);
    setImage(defaultImagePath);
    updatePrediction(defaultImagePath);

    // Set image
    function setImage(imagePath) {
        imageContainer.empty();

        let image = $('<img/>', {
            alt: '',
            src: imagePath
        }).css({
            width: '100%',
            height: '100%'
        });

        imageContainer.append(image);

        return inputRowData[rowId].image = imagePath;
    }

    function updatePrediction(imagePath) {
        prediction(imagePath).then(function(result) {
            drawPrediction(targetClassContainer, result, rowId);
        });
    }

    imageInput.on('change', function(e) {
        var file = e.target.files[0];
        if (file) {
            // Validate to be image file
            let fileType = file.type.split('/')[0];
            if (fileType === 'image') {
                // Change image here
                setImage(file.path);
                updatePrediction(file.path);
                updateRow(rowId);
            } else {
                alert('ONLY SUPPORT IMAGE FILE');
                imageInput.val('');
            }
        }
    });

    return;
}

function addConfigContainer(container, rowId) {
    // Add input controller
    let configContainer = $('<div/>', {
        id: 'config-container-' + rowId
    }).css({
        'width': 'calc(100% - 250px)',
        'height': '100%',
        'box-sizing': 'border-box',
        'background': '#d9d9d9',
        'padding': '2px',
        'overflow-x': 'auto',
        'overflow-y': 'hidden',
        'float': 'left',
        'display': 'inline-block',
        'white-space': 'nowrap'
    });

    container.append(configContainer);
    return;
}

export function addConfiguration(savedData) {

    if (!isConfigExist(savedData, currentRow)) {
        if (configurations[currentRow]) {
            configurations[currentRow].push(savedData);
            updateRow();
        } else {
            configurations[currentRow] = [];
            configurations[currentRow].push(savedData);
            updateRow();
        }
    }
}

function isConfigExist(data, row) {

    if (configurations[row]) {
        for (var i = 0; i < configurations[row].length; ++i) {
            if (configurations[row][i].id === data.id) {
                return true;
            }
        }
        return false;
    }

    return false;
}

function removeConfiguration(saveId, rowNumber) {

}

function drawPrediction(container, data, rowId) {

    container.empty();

    data = data.sort(function(a,b) {
        return d3.ascending(parseFloat(a.score), parseFloat(b.score))
    });

    let classIndex = parseInt(data[data.length - 1]['id']);
    inputRowData[rowId].target = classIndex;

    let margin = { top: 0, right: 0, bottom: 0, left: 0 };
    let width = container.width() - margin.left + margin.right;
    let height = container.height() - margin.top - margin.bottom;

    let svg = d3.select('#' + container.attr('id')).append('svg')
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

    let bars = svg.selectAll('.' + container.attr('id') + '-bar')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'compare-bar');

     bars.append('rect')
        .attr('id', function(d) { return 'compare-bar-' + rowId + '-' + d.id })
        .attr('class', 'compare-rect-' + rowId)
        .attr('y', function(d) {
            return y(d.names);
        })
        .style('cursor', 'pointer')
        .attr('height', y.bandwidth())
        .attr('x', 0)
        .style('fill', function(d,i) {
            return (i === data.length - 1) ? '#fdae61': '#e0e0e0';
        })
        .style('stroke', 'none')
        .style('stroke-width', '2px')
        .transition().delay(500)
        .attr('width', function(d) {
            return x(d.score);
        });

    bars.append('text')
        .attr('y', function(d) {
            return y(d.names) + y.bandwidth() / 2 + 6;
        })
        .attr('x', function(d) {
            return 0;
        })
        .style('font-size', '14px')
        .style('fill', '#000')
        .text(function(d) { return parseFloat(d.score).toFixed(1); });

    svg.append('g')
        .attr('class', 'class-axis')
        .style('font-size', '12px')
        .style('fill', '#fff')
        .attr('transform', 'translate(60, 0)')
        .call(yAxis);

    bars.on('click', function(d) {
        //console.log(inputRowData[rowId].target);
        //console.log(d.id);
        d3.selectAll('.compare-rect-' + rowId).style('fill', '#e0e0e0');
        d3.selectAll('#compare-bar-' + rowId + '-' + d.id)
            .style('fill', '#fdae61');
        inputRowData[rowId].target = parseInt(d.id);

        updateRow();
    });
}

// Visualize all configuration segments and rows
async function updateRow() {

    let imagePath = inputRowData[currentRow].image;
    let targetClass = inputRowData[currentRow].target;
    let configurationData = configurations[currentRow];

    $('#config-container-' + currentRow).empty();

    if (configurationData) {

        var promises = [];

        for (var i = 0; i < configurationData.length; ++i) {

            let config = configurationData[i];

            // Draw configuration Container
            let configContainer = $('<div/>').css({
                width: '225px',
                height: '100%',
                'box-sizing': 'border-box',
                'margin-left': '2px',
                'margin-right': '2px',
                'background': '#fff',
                'float': 'left'
            });

            $('#config-container-' + currentRow).append(configContainer);

            // Generate output
            console.log(config);
            // Re draw output
            // Image name
            let configTitle = $('<div/>').css({
                width: '100%',
                height: '30px',
                'line-height': '30px',
                'overflow': 'hidden',
                'font-size': '14px',
                'padding-left': '5px',
                'background': '#252525',
                'color': '#fff',
                'box-sizing': 'border-box'
            }).html(config.name);

            configContainer.append(configTitle);

            // Generate output
            let configOutput = $('<div/>').css({
                width: '100%',
                height: 'calc(50% - 15px)',
                'box-sizing': 'border-box',
                'border': '1px solid #000'
            });

            configContainer.append(configOutput);

            await runLrpOnly(imagePath, config.configuration, targetClass).then(function(result) {
                let outputPath = path.join(__dirname, '..', '..', '..', 'output.png')
                configOutput.empty();
                configOutput.append($('<img/>', {
                    alt: '',
                    src: outputPath + '?' + (new Date().getTime())
                }).css({ width: '100%', height: '100%' }));
            });

            let configSetting = $('<div/>', {
                id: 'segments-config-' + currentRow + '-' + i
            }).css({
                width: '100%',
                height: 'calc(50% - 15px)',
                'box-sizing': 'border-box',
                'border': '1px solid #000',
                'overflow': 'hidden',
                'padding': '2px'
            }).html('segment details');

            configContainer.append(configSetting);

            drawConfiguration(configSetting, config);
        };

        //Promise.all(promises).then(a => console.log(a));
    }
}

function drawConfiguration(container, configData) {
    // Clear container
    container.empty();

    console.log(configData);

    // List of LRP parameters
    let parameters = {
        'theta0': '&#952;<sub>0</sub>',
        'theta1': '&#952;<sub>1</sub>',
        'gamma0': '&#947;<sub>0</sub>',
        'gamma1': '&#947;<sub>1</sub>',
        'gamma1p': '&#947;<sub>1p</sub>',
        'gamma1n': '&#947;<sub>1n</sub>',
        'gamma2': '&#947;<sub>2</sub>',
        'eps': '&#949;',
        'alpha': '&#945;',
        'beta': '&#946;',
    };

    let lrp_methods = {
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

    let segmentArray = [];
    let segmentHeight = container.height() / configData.configuration.length;

    for (let i = 0; i < configData.configuration.length; ++i) {
        let method = configData.configuration[i].method[0];
        segmentArray.push('S' + (i + 1) + ' ' + lrp_methods[method] );

        let segment = configData.configuration[i];

        // Add container
        let segmentContainer = $('<div/>').css({
            width: '100%',
            height: segmentHeight + 'px',
            'box-sizing': 'border-box',
            'background': '#fff',
            'border': '1px solid #d9d9d9'
        });

        let x0 = (i === 0) ? segment.x0 : segment.x0 - 1;
        let x1 = (i === configData.configuration.length - 1) ? segment.x1 - 1 : segment.x1 - 2;

        let methodStr = "<font style='float: left; color: #000;'>" + x0 + '</font>' + 'Segment ' + (i + 1) + ' (LRP-' + lrp_methods[segment.method[0]] + ")<font style='float: right; color: #000;'>" + x1 + "</font>";

        let headerContainer = $('<div/>').css({
            'width': '100%',
            height: '20px',
            'line-height': '20px',
            'font-size': ((segmentHeight / 2) < 14) ? (segmentHeight / 2)  + 'px' : '14px',
            'box-sizing': 'border-box',
            'text-align': 'center',
            'background': segmentColors[i],
            'border': '1px solid #000'
        }).html(methodStr);

        /*
        let parameters_str = "";
        Object.keys(parameters).forEach(function(param) {
            if (segment[param] > 0) {
                parameters_str += '[' + parameters[param] + ' = ' + segment[param] + '] ';
            }
        });*/

        // Equation container
        let svgContainer = $('<div/>', {
            id: 'formula-' + i + '-' + currentRow + '-' + configData.id
        }).css({
            'width': '100%',
            height: 'calc(100% - 20px)',
            'font-size': ((segmentHeight / 2) < 12) ? (segmentHeight / 2)  + 'px' : '12px',
            'box-sizing': 'border-box',
            'text-align': 'center',
            'overflow-x': 'hidden',
            'overflow-y': 'auto',
            'padding-top': '2px'
        });//.html(parameters_str);

        container.append(segmentContainer);
        segmentContainer.append(headerContainer);
        segmentContainer.append(svgContainer);
        updateEquation(svgContainer, segment);
    }
}