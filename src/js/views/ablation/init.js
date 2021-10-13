import path from 'path';
import * as util from '../../utils';
import * as main from '../../';
import deviationPlot from './deviationPlot';
import nodelist from './nodelist';

// Intermediate_scores
var intermediate_dir = path.join(__dirname, '..', '..', '..', '..', 'intermediate_scores');

export default function()
{
    let config_data = undefined;
    if (main.getLrpCurrentSaveData()) {
        config_data = main.getLrpCurrentSaveData();
    } else {
        config_data = main.getLrpCurrentData();
    }

    read_pickle_files().then(function(result) {
        // Reset all node list
        nodelist();
        // Draw layer deviation
        deviationPlot(result, config_data);
    });
}

function read_pickle_files()
{
    let promises = [];

    /* Read all files for every layer */
    for (let i = 0; i < 39; ++i) {
        let filepath = path.join(intermediate_dir, 'intermediate_scores_' + i + '.pickle');
        promises.push(util.readPickle(filepath).then(data => { return data; }));
    }

    return Promise.all(promises);
}