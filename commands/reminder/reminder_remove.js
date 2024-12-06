const fs = require('fs');
const { checkPermission } = require('../../permissionChecker.js');


exports.removeReminder = async function(interaction) {
    const guildId = interaction.guildId;
    const commandName = 'reminder-remove'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (hasPermission) {
        fs.writeFileSync('reminders.json', JSON.stringify([], null, 4));
        await interaction.reply('All reminders have been removed.');
    } else {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }
};
