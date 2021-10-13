import childProcess from 'child_process';
import * as main from '..';

var process = undefined;
export default function(layerId, valueRange) 
{

    return new Promise(function(resolve, reject) {

        if (process) { process.kill('SIGINT') }

        let imagePath = main.getInputImagePath();

        process = childProcess.spawn('python3', ['./src/lrp_pytorch/brushByHeatmap.py', ['-i' + imagePath.toString()], ['-l' + layerId], ['-s' + valueRange[0]], ['-e' + valueRange[1]], ['-a' + 0.6], ['-c' + '41ab5d']]);

        process.stdout.on('data', function(data) {
            //console.log(data.toString());
        });

        process.stderr.on('data', function(errorMessage) {
            reject('Error: ' + errorMessage);
        });

        process.on('close', function() {
            resolve('done');
        });
    });
}