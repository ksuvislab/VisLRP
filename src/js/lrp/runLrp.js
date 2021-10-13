import ChildProcess from 'child_process';

export default function(imagePath, config, targetClass) {

    return new Promise(function(resolve, reject) {

        let childProcess = ChildProcess.spawn('python3', ['./src/lrp_pytorch/lrp.py', ['-i' + imagePath.toString()], ['-c' + JSON.stringify(config)], ['-l' + "True"], ['-t' + targetClass], ['-s' + '0'], ['-n' + 'None']], {detached: true});

        childProcess.stdout.on('data', function(data) {
            console.log(data.toString());
        });

        // Stream error
        childProcess.stderr.on('data', function(data) {
            reject(data.toString());
        });

        // Done stream
        childProcess.on('close', function() {
            resolve('done');
        });
    });
}