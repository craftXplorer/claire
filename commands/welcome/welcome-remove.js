const fs = require('fs');
const { checkPermission } = require('../../permissionChecker.js');

/**
 * Function to handle the execution of the /welcome-remove command
 * @param {import('discord.js').CommandInteraction} interaction The interaction object
 */
async function welcomeRemoveCommand(interaction) {
    const guildId = interaction.guildId;
    const commandName = 'welcome-remove'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (hasPermission) {
        // Read the welcome settings file
        let welcomeSettings = JSON.parse(fs.readFileSync('./commands/welcome/welcomeSettings.json', 'utf-8'));

        // Check if the welcome settings exist for this guild
        if (welcomeSettings[interaction.guildId]) {
            // Remove the welcome settings for this guild
            delete welcomeSettings[interaction.guildId];

            // Write the updated welcome settings back to the file
            fs.writeFileSync('./commands/welcome/welcomeSettings.json', JSON.stringify(welcomeSettings, null, 4), 'utf-8');

            // Reply to the user indicating that the welcome message has been removed
            await interaction.reply({ content: 'Welcome message removed successfully!', ephemeral: true });
        } else {
            // Reply to the user indicating that there is no welcome message set for this server
            await interaction.reply({ content: 'There is no welcome message set for this server!', ephemeral: true });
        }
    } else {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }
}


module.exports = { welcomeRemoveCommand };
