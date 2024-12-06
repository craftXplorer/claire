const { checkPermission } = require('../../permissionChecker.js');
const { EmbedBuilder } = require('discord.js');

async function helpCommand(interaction) {
    const guildId = interaction.guildId;
    const commandName = 'help'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (hasPermission) {
        const helpEmbed = new EmbedBuilder()
        .setTitle('Bot Commands')
        .setDescription('Here are the available commands:')
        .addFields(
            { name: '/ai-setchannel', value: 'Define a channel to chat with Claire-AI. Use again to remove the channel.' },
            { name: '/embed', value: 'Create an embed with various options for customization.' },
            { name: '/help', value: 'See this list.' },
            { name: '/perms', value: 'Define the role permissions for each command.' },
            { name: '/perms-list', value: 'See a list of the role permissions for each command.' },
            { name: '/placeholders', value: 'See a list of all placeholders for the commands.' },
            { name: '/poll', value: 'Create a poll with up to five options and settings for anonymity and maximal votes.' },
            { name: '/reminder', value: 'Set a reminder with specific time and message. Available in single alert and intervals.' },
            { name: '/reminder-remove', value: 'Remove a specific timer with its id.' },
            { name: '/reminder-remove-all', value: 'Remove all reminders.' },
            { name: '/simulate-join', value: 'Simulate a user join. For developers only!' },
            { name: '/welcome', value: 'Welcome new members with a personalized message as an embed.' },
            { name: '/welcome-remove', value: 'Remove your welcome message.' }
            // Add more command descriptions as needed
        )
        .setColor('#343434');

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
    } else {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }
}

module.exports = { helpCommand };
