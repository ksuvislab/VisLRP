import $ from 'jquery';
import path from 'path';
import * as main from '..';
import * as lrp from '.';
import { segmentColors } from './listSegments';

let directoryPath = path.join(__dirname, '..', '..', '..', 'intermediate_images');

// Update intermediate images
export default function() {

    let segmentData = (main.getLrpCurrentSaveData()) ? main.getLrpCurrentSaveData() : main.getLrpCurrentData();

    for (let i = 0; i < segmentData.length; ++i) {

        let imageName = "intermediate_images_" + segmentData[i].x0 + ".png" + '?' + (new Date().getTime());
        let imagePath = path.join(directoryPath, imageName);
        $('#intermediate-images-' + segmentData[i].id).attr('src', imagePath).css({ width: '100%', height: '100%' });;
    }

    return;
}

export function loadingIntermediateImages() {

    let segmentData = (main.getLrpCurrentSaveData()) ? main.getLrpCurrentSaveData() : main.getLrpCurrentData();

    for (let i = 0; i < segmentData.length; ++i) {

        $('#intermediate-images-' + segmentData[i].id).attr('src', '../../resources/loading.gif').css({ width: '30px', height: '30px' });
    }
}