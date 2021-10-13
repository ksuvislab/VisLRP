import $ from 'jquery';
import * as main from '..';
import * as lrp from '../lrp';
import { hideConfiguration } from './initSettingBtn';

var presetButtons = $('.preset-button');
var lrpViews = $('#views-lrp');

export default function() {

    presetButtons.off().on('click', function(e) {
        e.stopPropagation();
        // Get current template
        let template = $(this).val();

        // Get all data
        let segmentData = (main.getLrpCurrentSaveData()) ? main.getLrpCurrentSaveData() : main.getLrpCurrentData();


        let segmentId = lrp.getCurrentSegmentId();
        let x0 = segmentData[segmentId].x0;
        let x1 = segmentData[segmentId].x1;

        segmentData[segmentId] = lrp.loadTemplate(template);
        // Copy old current segment data
        segmentData[segmentId].id = segmentId;
        segmentData[segmentId].x0 = x0;
        segmentData[segmentId].x1 = x1;

        if (main.getLrpCurrentSaveData()) {
            main.setLrpCurrentSaveData(segmentData)
        } else {
            main.setLrpCurrentData(segmentData);
        }

        main.visualize(segmentData);
    });

    return;
}