import $ from 'jquery';
import path from 'path';
import * as lrp from './lrp';
import * as ui from './ui';
import * as utils from './utils';
import * as ablation from './ablate';
//import * as ablate from './ablate';

var lrpCurrentSaveData = undefined;
var lrpCurrentSaveName = "My New Model";

var lrpCurrentData = undefined;

var targetClass = 483; //  Set target class as castle by default
var inputImagePath = path.join(__dirname, '..', 'lrp_pytorch', 'images', 'castle.jpg'); // Default image
var originalPrediction = undefined;


// Start system onload
window.onload = function()
{
    initializeUI();
    listSaveData();
    originalPredict().then(function() {
        //start();
        //start();
        //runLRP();
    });

    return;
}

// Initialize UI components
export function initializeUI()
{
    ui.initNewButton();
    ui.initSaveButton();
    ui.initSideToggleButton();
    ui.initInputImage(inputImagePath);

    // Lrp buttons
    ui.initTemplateButtons();
    ui.initFlippingButton();
    ui.initAnalysisButton();
    ui.initCompareButton();

    return;
}

// List save data
export function listSaveData()
{
    utils.loadSaveFiles().then(function(data) {
        ui.listSaveData(data);
        start();
    });

    return;
}

// Create data manager
export function start()
{
    // Save data
    if (lrpCurrentSaveData) {
        visualize(lrpCurrentSaveData);
        $('#current-lrp-model').hide();
    } else {
        lrpCurrentSaveName = "My New Model";
        // Initialize template
        var template = lrp.loadTemplate('0');
        lrpCurrentData = [];
        lrpCurrentData.push(template);
        visualize(lrpCurrentData);
        $('#current-lrp-model').show();
    }

    return;
}

// Visualize
export function visualize(configurationData)
{
    //
    console.log(configurationData);

    // Show current model
    ui.showCurrentData(lrpCurrentData);
    // Visualize segment ruler
    lrp.createSegment('lrp-segments-body', configurationData);
    // Visualize number of segment and add buttons
    lrp.listSegments('lrp-segments-lists', configurationData);
    // Updatee intermediate image and barchart
    lrp.updateIntermediate();
    //
    lrp.updateConfiguration(configurationData);


    /*
    console.log(configurationData);
    lrp.listSegments('lrp-segments-lists', configurationData);
    lrp.createSegment('lrp-segments-body', configurationData);
    lrp.updateIntermediate();
    $('#ablate-button').off().on('click', function() {
        $('#lrp-ablate-container').width('100%');
        ablation.initialize(configurationData[0]);
    });
    // Rerun LRP
    // lrp.run();
    return;*/
}

// Predict classes
export function originalPredict()
{
    return new Promise(function(resolve, reject) {
        lrp.getPrediction(inputImagePath).then(function(result) {
            originalPrediction = result;
            lrp.drawBarChart('lrp-result-class-input', result, true);
            resolve();
        });
    });
}

// Run lrp
export function runLRP()
{
    lrp.run();
    return;
}

///////////////////////////////////////////////////////////////////////////////
//
//  Utilities
//
export function setLrpCurrentSaveData(data) {
    return lrpCurrentSaveData = data;
}

export function setCurrentSaveName(name) {
    return lrpCurrentSaveName = name;
}

export function getCurrentSaveName() {
    return lrpCurrentSaveName;
}

export function getLrpCurrentSaveData(data) {
    return lrpCurrentSaveData;
}

export function setLrpCurrentData(data) {
    return lrpCurrentData = data;
}

export function getLrpCurrentData() {
    return lrpCurrentData;
}

export function setInputImagePath(imagePath) {
    return inputImagePath = imagePath;
}

export function getInputImagePath () {
    return inputImagePath;
}

export function addSegmentToCurrentData() {

    let lrpData = (lrpCurrentSaveData) ? lrpCurrentSaveData : lrpCurrentData;

    // Shrink prev
    lrpData[lrpData.length - 1].x1 -= 1;
    var prevX1 = lrpData[lrpData.length - 1].x1;

    let newSegment = lrp.loadTemplate('0');

    newSegment.id = lrpData.length;
    newSegment.x0 = prevX1;
    newSegment.x1 = 39;

    lrpData.push(newSegment);

    if (lrpCurrentSaveData) {
        setLrpCurrentSaveData(lrpData);
        return visualize(lrpData);
    } else {
        setLrpCurrentData(lrpData);
        return visualize(lrpData);
    }

}

export function setLrpSpecificData(segment) {

    if (lrpCurrentSaveData) {
        lrpCurrentSaveData[segment.id] = segment;
        // When set specific the method will change to customize
        //lrpCurrentSaveData[segment.id].method[0] = 'customize';
        //return visualize(lrpCurrentSaveData);
        lrpCurrentSaveData[segment.id].method[0] = updateMethod(segment);
        // Updatee intermediate image and barchart
    } else {
        lrpCurrentData[segment.id] = segment;
        // When set specific the method will change to customize
        //lrpCurrentData[segment.id].method[0] = 'customize';
        //return visualize(lrpCurrentData);
        lrpCurrentData[segment.id].method[0] = updateMethod(segment);
        // Updatee intermediate image and barchart
    }
}

// Disable intermediate button
export function disableIntermediateButton() {
    $('#lrp-result-layer-btn').removeClass('active');
    return;
}

export function getTargetClass() {
    return targetClass;
}

export function setTargetClass(classIndex) {
    return targetClass = classIndex;
}

export function getOriginalPrediction() {
    return originalPrediction;
}

function updateMethod(data){

    let ParameterMethod_actual =[]

    if(((data.theta0 == 0) && (data.theta1 == 1)) && ((data.gamma0 == 0) && ((data.gamma1 == 1) && (data.gamma1p == 0) && (data.gamma1n == 0)) && (data.gamma2 == 0)) && (data.eps == 0) && (data.alpha == 1) && (data.beta == 0)){

         ParameterMethod_actual = ['0'];
        // data_updated.method = ParameterMethod_actual;

    } else if( ((data.theta0 == 1) && (data.theta1 == 0)) && ((data.gamma0 == 0) && ((data.gamma1 == 0) && (data.gamma1p == 0) && (data.gamma1n == 0)) && (data.gamma2 == 1)) && (data.eps == 0) && (data.alpha == 1) && (data.beta == 0)){

         ParameterMethod_actual = ['w_square'];
        // data_updated.method = ParameterMethod_actual;
    } else if( ((data.theta0 == 0) && (data.theta1 == 1)) && ((data.gamma0 == 0) && (data.gamma1 == 1) &&  (data.gamma1p == 0) && (data.gamma1n == 0) && (data.gamma2 == 0)) && (data.eps !=0) && (data.alpha == 1) && (data.beta == 0)){

         ParameterMethod_actual = ['epsilon'];
        // data_updated.method = ParameterMethod_actual;
    } else if( ((data.theta0 == 0) && (data.theta1 == 1)) && ((data.gamma0 == 0) && (data.gamma1 == 1) &&  (data.gamma1p !=0) && (data.gamma1n == 0) && (data.gamma2 == 0)) && (data.eps == 0) && (data.alpha == 1) && (data.beta == 0)){

         ParameterMethod_actual = ['gamma'];
        // data_updated.method = ParameterMethod_actual;
    } else if( ((data.theta0 == 1) && (data.theta1 == 0)) && ((data.gamma0 == 1) && ((data.gamma1 == 0) && (data.gamma1p == 0) && (data.gamma1n == 0)) && (data.gamma2 == 0)) && (data.eps == 0) && (data.alpha == 1) && (data.beta == 0)){

         ParameterMethod_actual = ['flat'];
        // data_updated.method = ParameterMethod_actual;
    } else if( (data.alpha != 0) && (data.beta != 0) && (data.theta0 == 0) && (data.theta1 == 1) && (data.gamma0 == 0) && (data.gamma1 == 0) && (data.gamma1p == 1) && (data.gamma1n == 1) && (data.gamma2 == 0) && (data.eps == 0)){

         ParameterMethod_actual = ['alpha-beta'];
        // data_updated.method = ParameterMethod_actual;

    } else if( (data.alpha == 1) && (data.beta == 0) && (data.theta0 == 0) && (data.theta1 == 1) && (data.gamma0 == 0) && (data.gamma1 == 0) && (data.gamma1p == 1) && (data.gamma1n == 1) && (data.gamma2 == 0) && (data.eps == 0)){

         ParameterMethod_actual = ['alpha1-beta0'];
        // data_updated.method = ParameterMethod_actual;
    } else if( (data.alpha == 1) && (data.beta == 0) && (data.theta0 == 0) && (data.theta1 == 1) && (data.gamma0 == 0) && (data.gamma1 == 1) && (data.gamma1p != 0) && (data.gamma1n != 0) && (data.gamma2 == 0) && (data.eps == 0)){

         ParameterMethod_actual = ['z_beta'];
        // data_updated.method = ParameterMethod_actual;
    } else{
        ParameterMethod_actual = ['customize'];
        // data_updated.method = ['custom'];
    }

    return ParameterMethod_actual;
}