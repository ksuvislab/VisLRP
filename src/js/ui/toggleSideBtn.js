import $ from 'jquery';
import * as main from "..";

var toggleSideBtn = $('#toggle-side-btn');
var mainContainer = $('#main');
var sidebarContainer = $('#sidebar');

export default function() 
{

    toggleSideBtn.on('click', function() {

        toggleSideBtn.toggleClass('toggled');

        if (toggleSideBtn.hasClass('toggled')) {
            mainContainer.width('100%');
            sidebarContainer.width('0px');
            toggleSideBtn.html('<i class="fas fa-caret-right"></i>');
            
        } else {
            sidebarContainer.width('250px');
            mainContainer.width('calc(100% - 250px)');
            toggleSideBtn.html('<i class="fas fa-caret-left"></i>');
        }
        
    });

    mainContainer.on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', 
    function() {
        // Do something after animation
    });

    return;
}