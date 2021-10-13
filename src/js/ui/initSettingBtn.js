import $ from 'jquery';
import * as main from '..';
import * as lrp from '../lrp';

var settingBtn = $('#lrp-result-config-btn');
var settingContainer = $('#views-lrp-segments');
var intermediateContainer = $('#views-lrp-intermediate');

export default function() {

    settingBtn.off().on('click', function() {

        if (intermediateContainer.is(':visible')) {

            // Hide intermediate container
            intermediateContainer.hide();

            // Show setting container
            settingContainer.show();

            // Reinitialize all configuration
            main.initLRP();

            if (main.getLrpCurrentSaveData()) {
                let lrpCurrentSaveData = main.getLrpCurrentSaveData();
                lrp.updateConfiguration(lrpCurrentSaveData);
            } else {
                let lrpCurrentData = main.getLrpCurrentData();
                lrp.updateConfiguration(lrpCurrentData);
            }
        }
    });

    return;
}