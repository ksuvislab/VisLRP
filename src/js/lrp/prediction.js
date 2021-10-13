import * as main from "..";
import ChildProcess from 'child_process';
import * as lrp from ".";

let childProcess = undefined;

export default function(imagePath) 
{

    return new Promise(function(resolve, reject) {
        // Terminate old child process
        if (childProcess) {
            childProcess.kill();
        }

        if (!imagePath) {
            alert('Please input your image');
            return;
        }

        
        let config = [];
        config.push(lrp.loadTemplate('epsilon'));

        // No selected class set it as defalt, castle (483)
        childProcess = ChildProcess.spawn('python3', ['./src/lrp_pytorch/pytorch_lrp.py', ['-i' + imagePath.toString()], ['-c' + JSON.stringify(config)], ['-l' + "False"], ['-t' + 483], ['-s' + 1], ['-n' + "None"]]);

        // Python stream data
        childProcess.stdout.on('data', function(data) {
            // Detect prediction class list and check json format
            if (data.toString().length > 2) {
                if (isJsonString(data.toString())) {
                    resolve(JSON.parse(data.toString()));
                }
            }
        });

        // Python error
        childProcess.stderr.on('data', function(errorMessage) {
            reject(errorMessage.toString());
        });

        // Finish python process
        childProcess.on('close', function() {
            resolve();
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