import $ from 'jquery';
import * as main from '..';

let runLRPBtn = $('#lrp-result-run-btn');

export default function() {
    
    runLRPBtn.off().on('click', function() {
        main.runLRP();
    });

}