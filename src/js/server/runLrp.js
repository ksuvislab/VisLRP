import $ from 'jquery';
import { json } from 'd3';

export default function()
{

    let result = undefined;
    let url = 'https://localhost:5000';

    $.ajaxSetup({ 'async': false });

    let json = JSON.stringify({
        input: i,
        config: c,
        lrp: l,
        classIndex: this,
    });

    $.ajax({
        type: 'GET',
        url: url,
        data: json,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function(msg) {
            console.log(msg);
        }
    });

    $.ajaxSetup({ 'async': true });

    return result;
}