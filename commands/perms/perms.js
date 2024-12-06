const fs = require('fs');
const { checkPermission } = require('../../permissionChecker.js');

async function permsCommand(interaction) {
    const guildId = interaction.guildId;
    const commandName = 'perms'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (hasPermission) {
        const command = interaction.options.getString('command');
        const roles = interaction.options.getString('role-ids').split(',');

        try {
            let permissions = {};
            if (fs.existsSync('./commands/perms/permissions.json')) {
                const data = fs.readFileSync('./commands/perms/permissions.json');
                permissions = JSON.parse(data);
            }

            if (!permissions[guildId]) {
                permissions[guildId] = {};
            }

            if (!permissions[guildId][command]) {
                permissions[guildId][command] = [];
            }

            const invalidRoles = [];
            for (const role of roles) {
                const index = permissions[guildId][command].indexOf(role);
                if (index > -1) {
                    // Role is present, remove it
                    permissions[guildId][command].splice(index, 1);
                } else if (interaction.guild.roles.cache.has(role)) {
                    // Role is absent and valid, add it
                    permissions[guildId][command].push(role);
                } else {
                    // Role is invalid
                    invalidRoles.push(role);
                }
            }

            if (invalidRoles.length > 0) {
                await interaction.reply({ content: `Invalid role IDs: ${invalidRoles.join(', ')}`, ephemeral: true });
                return;
            }

            // Clean up: if no roles are left for the command, delete the command entry
            if (permissions[guildId][command].length === 0) {
                delete permissions[guildId][command];
            }

            fs.writeFileSync('./commands/perms/permissions.json', JSON.stringify(permissions, null, 4));

            await interaction.reply('Permissions updated successfully!');
        } catch (error) {
            console.error('Error updating permissions:', error);
            await interaction.reply({ content: 'Failed to update permissions. Please try again later.', ephemeral: true });
        }
    } else {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }
}

module.exports = { permsCommand };
