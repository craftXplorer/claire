/**
 * Function to handle the execution of the /placeholders command
 * @param {import('commandkit').SlashCommandProps} param0 Interaction parameter object
 */

const { checkPermission } = require('../../permissionChecker.js');

async function sendPlaceholders({ interaction }) {
    const guildId = interaction.guildId;
    const commandName = 'placeholders'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (hasPermission) {
        const placeholders = `
Available placeholders:
- **/welcome**
  - *{user}*: User mention of new member
  - *{username}*: Username of new member
  - *{servername}*: Server name
  - *{<#1247922959696396422>}*: Channel mention (Replace "channel" with channel name or id)
  - *{avatar}*: Avatar URL of new member
  - *{server-icon}*: Server icon URL
  - *~n~*: Start a new line
            `;

        await interaction.reply({ content: placeholders, ephemeral: true });
    } else {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }
}
module.exports = { sendPlaceholders };
