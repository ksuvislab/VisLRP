import * as main from "..";
//import * as ablate from '../ablate';
import ChildProcess from 'child_process';
import * as lrp from ".";
import $ from 'jquery';
import kill from 'tree-kill';

let childProcess = undefined;
let loadingContainer = $('#lrp-result-loading');
let isLoading = false;

export default function() {

    if (childProcess) {
        console.log('KILL python process');
        kill(childProcess.pid, function() {
            runScript();
        });
    } else {
        runScript();
    }

    return;
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

function runScript()
{
    isLoading = true;

    loadingContainer.show();
    lrp.loadingIntermediateImages();

    let imagePath = main.getInputImagePath();

    if (!imagePath) {
        alert('Please input your image');
    } else {

        let config = (main.getLrpCurrentSaveData()) ? JSON.stringify(main.getLrpCurrentSaveData()) : JSON.stringify(main.getLrpCurrentData());

        console.log(config);

        var inputImage = imagePath;
        var targetClass = main.getTargetClass();
        console.log("Target class: " + targetClass);



        var testNode = "None";//'JSON.stringify({"layerID": 10, "nodeID": 0})';

        childProcess = ChildProcess.spawn('python3', ['./src/lrp_pytorch/pytorch_lrp.py', ['-i' + inputImage.toString()], ['-c' + config], ['-l' + "True"], ['-t' + targetClass], ['-s' + '20'], ['-n' + testNode]], {detached: true});

        // Stream output data
        // 0: output is ready
        // 1: intermediate image is ready
        // 2: intermediate json is ready
        childProcess.stdout.on('data', function(data) {

            let message = parseInt(data.toString());

            switch (message) {
                case 0:
                    loadingContainer.hide();
                    lrp.updateOuputImage();
                    break;
                case 1:
                    lrp.updateIntermediateImages();
                    break;
                case 2:
                    console.log('All R, A tensors saved');
                    break;
                default:
                    break;
            }
        });

        // Stream error
        childProcess.stderr.on('data', function(data) {
            console.log(data.toString());
        });

        // Done stream
        childProcess.on('close', function() {
            console.log('done');
            childProcess = undefined;
            isLoading = false;
        });
    }
}