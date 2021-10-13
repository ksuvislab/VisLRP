import childProcess from 'child_process';
import * as main from '..';
import * as lrp from '.';

var process = undefined;

export default function(layerId, nodeId, tensorType) {

    if (process) { process.kill('SIGINT'); }

    process = childProcess.spawn('python3', ['./src/lrp_pytorch/generateHeatmap.py', ['-1' + layerId, ['-n' + nodeId], ['-d' + tensorType ]]]);

    process.stdout.on('data', function(data) {
        console.log(data.toString());
    });

    process.stderr.on('data', function(errorMessage) {
        console.log('Error: ' + errorMessage);
    });

    process.on('close', function() {
        console.log('done');
    });
}