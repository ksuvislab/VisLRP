import Unpickle from 'unpickle';
import Fs from 'fs';

export default function(filePath)
{
    return new Promise(function(resolve, reject) {
        Fs.readFile(filePath, function(error, pickleData) {

            if (error) reject(error);

            // PickleData is returned in buffer
            let data = Unpickle(pickleData);
            resolve(data);
        });
    });
}