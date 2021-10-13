import $ from 'jquery';
import * as lrp from '../lrp';
import * as views from '../views';

var analysisButton = $('#lrp-result-analysisbtn');
var analysisPanel = $('#lrp-analysis-container');

export default function()
{
    analysisButton.off().on('click', function() {

        // Remove flipping pixels panels
        remove_pixelFlipping_panel();

        analysisButton.toggleClass('toggled');

        if (analysisButton.hasClass('toggled')) {
            // Show ablation panel and initialze it
            analysisPanel.width('calc(100% - 300px)');
        } else {
            analysisPanel.width('0');
        }

    });

    analysisPanel.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function() {
        if (analysisButton.hasClass('toggled')) {
            //lrp.initAnalysis();
            views.init_ablation();
        }
    });
}

// Remove flipping panel
function remove_pixelFlipping_panel()
{
    var ablationButton = $('#lrp-result-flipbtn');
    var ablationPanel = $('#lrp-flipping-container');

    if (ablationButton.hasClass('toggled')) {
        ablationPanel.width('0');
        ablationButton.removeClass('toggled');
    }

    return;
}