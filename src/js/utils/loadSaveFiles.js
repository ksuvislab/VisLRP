import fs from 'fs';
import path from 'path';

// Configuration direcotry path
let configDirectory = path.join(__dirname, '..', '..', 'configurations');

// Load and parse all saved configuration files
export default function()
{
    return new Promise(function(resolve, reject) {
        loadAllFiles().then(parseJsonFiles).then(function(result) {
            resolve(result);
        });
    });
}

// Load all file name in configuration directory
function loadAllFiles()
{
    return new Promise(function(resolve, reject) {
        fs.readdir(configDirectory, function(error, files) {
            if (error) reject(error);
            resolve(files);
        });
    });
}

// Parse save data in json format
function parseJsonFiles(files)
{
    var promises = [];

    files.forEach(function(file) {
        let filePath = path.join(configDirectory, file);
        let json_data = JSON.parse(fs.readFileSync(filePath));
        json_data.id = file;

        promises.push(json_data);
    });

    return Promise.all(promises);
}