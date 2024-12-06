const { addReminder, removeReminderById, removeAllReminders } = require('./reminder');
const { checkPermission } = require('../../permissionChecker.js');

async function reminderCommands(interaction) {
    const days = interaction.options.getInteger('days');
    const hours = interaction.options.getInteger('hours');
    const minutes = interaction.options.getInteger('minutes');
    const seconds = interaction.options.getInteger('seconds');
    const message = interaction.options.getString('message');
    const isInterval = interaction.options.getBoolean('type');
    const channelId = interaction.channelId;
    const userId = interaction.user.id;

    const response = addReminder(days, hours, minutes, seconds, message, isInterval, channelId, userId, interaction);
    await interaction.reply({ content: response, ephemeral: true });
}

async function removeReminder(interaction) {
    const guildId = interaction.guildId;
    const commandName = 'reminder-remove'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (!hasPermission) {
        return "You don't have permission to use this command.";
    } else {

        const id = interaction.options.getString('id');
        const response = removeReminderById(id);
        await interaction.reply({ content: response, ephemeral: true });
    }
}

async function removeAll(interaction) {
    const guildId = interaction.guildId;
    const commandName = 'reminder-remove-all'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (!hasPermission) {
        return "You don't have permission to use this command.";
    } else {

        removeAllReminders();
        await interaction.reply({ content: 'All reminders have been removed.', ephemeral: true });
    }
}

module.exports = {
    reminderCommands,
    removeReminder,
    removeAll,
};
