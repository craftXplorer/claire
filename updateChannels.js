const fs = require('fs');
require('dotenv').config();

async function updateChannelsVariable() {
    const envConfig = fs.readFileSync('.env', 'utf-8').split('\n');
    const channelsLineIndex = envConfig.findIndex(line => line.startsWith('CHANNELS='));
    if (channelsLineIndex !== -1) {
        const channels = envConfig[channelsLineIndex].split('=')[1].split(',');
        return channels;
    }
    return [];
}

module.exports = { updateChannelsVariable };
