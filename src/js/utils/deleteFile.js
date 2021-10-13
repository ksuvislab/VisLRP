import path from 'path';
import fs from 'fs';

// Delete file 
export default function(filename) 
{
    return new Promise(function(resolve, reject) {

        // Create file path
        let deletePath = path.join(__dirname, '..', '..', 'configurations', filename);

        fs.unlink(deletePath, function(error, data) {
            if (error) reject(error);
            resolve(data);
        });
    });
}