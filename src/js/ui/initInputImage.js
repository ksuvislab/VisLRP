import $ from 'jquery';
import * as main from '..';
import * as lrp from '../lrp';

var inputImage = $('#lrp-input-image');
var inputImageButton = $('#lrp-result-input-file');

export default function(imagePath) {
    // Set image input button
    setInputImageButton();
    setImage(imagePath);
    return;
}

// Initialize input iamge button
function setInputImageButton() {

    inputImageButton.off().on('change', function() {
        var file = event.target.files[0];
        if (file) {
            // Validate to be image file
            let fileType = file.type.split('/')[0];
            if (fileType === 'image') {
                main.setInputImagePath(file.path);
                setImage(file.path);
                main.originalPredict().then(function() {
                    main.runLRP();
                });
            } else {
                alert('ONLY SUPPORT IMAGE FILE');
                inputImageButton.val('');
            }
        }
    });

    return;
}

// Set image input
function setImage(imagePath) {
    inputImage.attr('src', imagePath);
    return;
}