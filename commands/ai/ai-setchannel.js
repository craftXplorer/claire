const fs = require('fs');
const { EmbedBuilder, ChannelType } = require('discord.js');
require('dotenv').config();
const { checkPermission } = require('../../permissionChecker.js');


async function aiSetChannelCommand(interaction) {
    const guildId = interaction.guildId;
    const commandName = 'ai-setchannel'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (hasPermission) {
        const channel = interaction.options.getChannel('channel');

        if (channel.type !== ChannelType.GuildText) {
            await interaction.reply({ content: 'Please select a text channel.', ephemeral: true });
            return;
        }

        // Read the existing .env file content
        const envConfig = fs.readFileSync('.env', 'utf-8').split('\n');

        // Find the CHANNELS line or create one if it doesn't exist
        let channelsLineIndex = envConfig.findIndex(line => line.startsWith('CHANNELS='));
        let currentChannels = [];
        if (channelsLineIndex !== -1) {
            currentChannels = envConfig[channelsLineIndex].split('=')[1].split(',');
        }

        let responseMessage;
        if (currentChannels.includes(channel.id)) {
            // Remove the channel if it already exists
            currentChannels = currentChannels.filter(ch => ch !== channel.id);
            responseMessage = `Channel <#${channel.id}> has been removed from the CHANNELS list.`;
        } else {
            // Add the channel if it does not exist
            currentChannels.push(channel.id);
            responseMessage = `Channel <#${channel.id}> has been added to the CHANNELS list.`;
        }

        if (channelsLineIndex === -1) {
            envConfig.push(`CHANNELS=${currentChannels.join(',')}`);
        } else {
            envConfig[channelsLineIndex] = `CHANNELS=${currentChannels.join(',')}`;
        }

        // Write the updated .env file
        fs.writeFileSync('.env', envConfig.join('\n'), 'utf-8');

        const embed = new EmbedBuilder()
            .setTitle('Channel Updated')
            .setDescription(responseMessage)
            .setColor('#343434');

        await interaction.reply({ embeds: [embed], ephemeral: false });
    } else {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }
}

module.exports = { aiSetChannelCommand };
