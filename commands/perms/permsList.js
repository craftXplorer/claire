const fs = require('fs');
const path = require('path');
const { checkPermission } = require('../../permissionChecker.js');

function permsListCommand(interaction) {
    const guildId = interaction.guildId;
    const commandName = 'reminder-remove'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (!hasPermission) {
        return "You don't have permission to use this command.";
    } else {
        const guildId = interaction.guildId;

        // Load permissions from JSON file
        const permissions = loadPermissions();

        if (!permissions[guildId] || Object.keys(permissions[guildId]).length === 0) {
            interaction.reply({ content: "No permissions defined for this guild.", ephemeral: true });
            return;
        }

        let permissionList = "Permissions for this guild:\n\n";
        for (const commandName in permissions[guildId]) {
            const roles = permissions[guildId][commandName].join(', ');
            permissionList += `**/${commandName}**: <@&${roles}>\n`;
        }

        interaction.reply({ content: permissionList, ephemeral: true });
    }
}

// Function to load permissions from JSON file
function loadPermissions() {
    const filePath = path.join(__dirname, 'permissions.json');
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading permissions file: ${err.message}`);
        return {};
    }
}

module.exports = { permsListCommand };
