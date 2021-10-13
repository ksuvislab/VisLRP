import $ from 'jquery';
import path from 'path';

var outputImage = $('#lrp-output-image');
let directoryPath = path.join(__dirname, '..', '..', '..');

export default function() {
    let output = 'output.png';
    let outputPath = path.join(directoryPath, output);
    outputImage.attr('src', outputPath + '?' + (new Date().getTime()));
    return;
}