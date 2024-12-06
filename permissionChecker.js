const fs = require('fs');

function checkPermission(guildId, commandName, member) {
    try {
        // Load permissions from JSON file
        const data = fs.readFileSync('./commands/perms/permissions.json');
        const permissions = JSON.parse(data);

        // Check if the guild has permissions defined
        if (permissions[guildId]) {
            // Check if the command has specific roles allowed
            if (permissions[guildId][commandName]) {
                const allowedRoles = permissions[guildId][commandName];
                // Check if the member has any of the allowed roles
                for (const roleId of allowedRoles) {
                    if (member.roles.cache.has(roleId)) {
                        return true; // Member has permission
                    }
                }
            } else {
                // If command has no specific roles allowed, allow execution by default
                return true;
            }
        } else {
            // If guild has no permissions defined, allow execution by default
            return true;
        }
    } catch (error) {
        console.error('Error checking permissions:', error);
    }
    return false; // Member does not have permission or an error occurred
}

module.exports = { checkPermission };
