import Fs from 'fs';
import ChildProcess from 'child_process';
import * as main from '..';
import * as lrp from ".";

let childProcess = undefined;

export default function (nodeData) {

    return new Promise(function(resolve, reject) {
        Fs.writeFile('flip_nodes/nodes.json', JSON.stringify(nodeData), function() {

            if (childProcess) { childProcess.kill() }

            let imagePath = main.getInputImagePath();

            if (!imagePath) {
                alert('Please input your image');
            } else {

                let inputImage = imagePath;

                childProcess = ChildProcess.spawn('python3', ['./src/lrp_pytorch/flip_node.py', ['-i' + inputImage.toString()], ['-n' + 'flip_nodes/nodes.json']]);

                // Data stream
                childProcess.stdout.on('data', function(data) {
                    console.log(data.toString());
                    if (data.toString().length > 2) {
                        if (isJsonString(data.toString())) {
                            //lrp.drawBarChart('lrp-result-class-input', JSON.parse(data.toString()));
                            resolve(JSON.parse(data.toString()));
                        }
                    }
                });

                // Error stream
                childProcess.stderr.on('data', function(errorMessage) {
                    reject('Error: ' + errorMessage);
                });

                // Output stream
                childProcess.on('close', function() {
                    console.log('Done fliping');
                    // Show new output
                });
            }

        });
    });
}

function isJsonString(str)
{
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}