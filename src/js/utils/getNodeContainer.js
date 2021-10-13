import $ from 'jquery';

// [height, width]
export default function(nodes)
{

    let full = $('#lrp-intermediate-score').width();
    let half = ($('#lrp-intermediate-score').width() / 2);
    let half2 = ($('#lrp-intermediate-score').width() / 4);
    
    switch (nodes) {
        case 64: return [half2, half2];
        case 128: return [half2, half];
        case 256: return [half, half];
        case 512: return [half, full];
        case 4096: return [full, full];
        default: return undefined;
    }
}