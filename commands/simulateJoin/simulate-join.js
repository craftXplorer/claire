const { SlashCommandBuilder } = require('discord.js');
const { checkPermission } = require('../../permissionChecker.js');

const data = new SlashCommandBuilder()
    .setName('simulate-join')
    .setDescription('Simulate a member joining.')
    .addUserOption(option =>
        option
            .setName('target-user')
            .setDescription('The user you want to emulate joining.')
            .setRequired(false)
    );

/**
 * @param {Object} param0
 * @param {import('discord.js').Interaction} param0.interaction
 * @param {import('discord.js').Client} param0.client
 */
async function run({ interaction, client }) {
    const guildId = interaction.guildId;
    const commandName = 'simulate-join'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (hasPermission) {
        const targetUser = interaction.options.getUser('target-user');

        let member;

        if (targetUser) {
            member =
                interaction.guild.members.cache.get(targetUser.id) ||
                (await interaction.guild.members.fetch(targetUser.id));
        } else {
            member = interaction.member;
        }

        client.emit('guildMemberAdd', member);

        await interaction.reply({ content: 'Simulated join!', ephemeral: true });
    } else {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }
}


module.exports = { data, run };
