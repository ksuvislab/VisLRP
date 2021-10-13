import $ from 'jquery';
import * as main from '..';
import { setCurrentSegmentId } from '../lrp';

let newButton = $('#new-model-button');

// Initialize new button events
export default function()
{
    newButton.off().on('click', function() {

        // Create confirm
        let confirmStartNew = confirm("Do you want to start new configuration?");

        if (confirmStartNew == true) {
            // Remove current save data
            setCurrentSegmentId(0);
            main.setLrpCurrentSaveData(undefined);
            main.setLrpCurrentData(undefined);
            // Restart system
            main.start();
        }

    });

    return;
}