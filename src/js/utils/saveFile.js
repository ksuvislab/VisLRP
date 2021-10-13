import fs from 'fs';
import path from 'path';

/**
 * Save user configuration using current datetime as filename
 * @param {string} name user defined name
 * @param {[objects]} configuration configuration data 
 */
export default function(name, configuration) 
{
    // Initialize write files
    let currentTime = getCurrentTime();
    let filename = currentTime + '.json';
    let writePath = path.join(__dirname, '..', '..', 'configurations', filename);
    let writeData = {
        name: name,
        date: currentTime.split('_')[0],
        time: currentTime.split('_')[1],
        configuration: configuration
    };

    // Write file
    fs.writeFileSync(writePath, JSON.stringify(writeData, null, 4), 'utf-8');
    return;
}

/**
 * Get current datetime as filename
 */
function getCurrentTime() 
{
    // Compute date time information
    let today = new Date();
    let hour = (today.getHours() < 10) ? '0' + today.getHours() : today.getHours();
    let minute = (today.getMinutes() < 10) ? '0' + today.getMinutes() : today.getMinutes();
    let second = (today.getSeconds() < 10) ? '0' + today.getSeconds() : today.getSeconds();
    let year = today.getFullYear();
    let month = (today.getMonth() < 10) ? '0' + today.getMonth() : today.getMonth();
    let day = (today.getDate() < 10) ? '0' + today.getDate() : today.getDate();

    // Format datetime to YYYY-MM-DD_HH:mm:ss
    let time = hour + ':' + minute + ':' + second;
    let date = year + '-' + month + '-' + day;

    return date + '_' + time;
}