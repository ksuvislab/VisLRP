import $ from 'jquery';
import * as utils from '../utils';
import * as main from '..';
import prompt from 'electron-prompt';

let saveButton = $('#save-model-button');

export default function()
{
    saveButton.off().on('click', function() {
        // Get current configuration
        let configuration = (main.getLrpCurrentSaveData()) ? main.getLrpCurrentSaveData() : main.getLrpCurrentData();

        // Prompt saving input
        prompt({
            title: 'Save Configuration',
            label: 'Please enter your configuration name:',
            value: '',
            inputAttrs: {
                type: 'string'
            },
            type: 'input'
        })
        .then((saveName) => {
            if(!isEmptyOrSpaces(saveName)) {
                // Save file if name is given
                utils.saveFile(saveName, configuration);
                main.listSaveData();
            }
        })
        .catch(console.error);
    });

    return;
}

// Check string is null or empty spaces
function isEmptyOrSpaces(str)
{
    return str === null || str.match(/^ *$/) !== null;
}