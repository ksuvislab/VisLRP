import $ from 'jquery';
import { initPixelFlipping } from '../lrp';
import { reset_top_selection } from '../lrp/horizontalBarChart';


var ablationButton = $('#lrp-result-flipbtn');
var ablationPanel = $('#lrp-flipping-container');

export default function()
{
    ablationButton.off().on('click', function() {

        // Remove analysis panel
        remove_analysis_panel();

        ablationButton.toggleClass('toggled');

        if (ablationButton.hasClass('toggled')) {

            // Show ablation panel and initialze it
            ablationPanel.width('calc(100% - 300px)');
            reset_top_selection();
            initPixelFlipping();

        } else {
            // Hide ablation panel
            ablationPanel.width('0');
        }

    });
}

// Remove analysis panel
function remove_analysis_panel()
{
    var analysisButton = $('#lrp-result-analysisbtn');
    var analysisPanel = $('#lrp-analysis-container');

    if (analysisButton.hasClass('toggled')) {
        analysisPanel.width('0');
        analysisButton.removeClass('toggled');
    }

    return;
}