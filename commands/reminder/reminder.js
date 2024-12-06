const fs = require('fs');
const path = require('path');
const { CronJob } = require('cron');
const { v4: uuidv4 } = require('uuid');
const { checkPermission } = require('../../permissionChecker.js');

const remindersFilePath = path.join(__dirname, 'reminders.json');

let reminders = [];

// Load reminders from the JSON file
function loadReminders() {
    if (fs.existsSync(remindersFilePath)) {
        const data = fs.readFileSync(remindersFilePath);
        reminders = JSON.parse(data);
    }
}

// Save reminders to the JSON file
function saveReminders() {
    fs.writeFileSync(remindersFilePath, JSON.stringify(reminders, null, 2));
}

// Add a new reminder
function addReminder(days, hours, minutes, seconds, message, isInterval, channelId, userId, interaction) {
    const guildId = interaction.guildId;
    const commandName = 'reminder'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (!hasPermission) {
        return "You don't have permission to use this command.";
    } else {

    const now = new Date();

    let errorMessage = "";
    
    // Check if days, hours, minutes, and seconds are within the allowed ranges
    if (days < 0 || days > 6) {
        errorMessage += "Days must be between 0 and 6.\n";
    }
    if (hours < 0 || hours > 23) {
        errorMessage += "Hours must be between 0 and 23.\n";
    }
    if (minutes < 0 || minutes > 59) {
        errorMessage += "Minutes must be between 0 and 59.\n";
    }
    if (seconds !== 0 && (seconds < 10 || seconds > 59)) {
        errorMessage += "Seconds must be 0 or between 10 and 59.\n";
    }

    if (errorMessage === "") {
        const reminderTime = new Date(now.getTime() +
            days * 24 * 60 * 60 * 1000 +
            hours * 60 * 60 * 1000 +
            minutes * 60 * 1000 +
            seconds * 1000
        );

        const id = uuidv4();
        const reminder = { id, time: reminderTime, message, isInterval, channelId, userId };
        reminders.push(reminder);
        saveReminders();

        return `Reminder set with ID: ${id} for <t:${Math.floor(reminderTime.getTime() / 1000)}:F>`;
    } else {
        return errorMessage;
    }
}
}

// Remove a specific reminder by its ID
function removeReminderById(id) {
    const initialLength = reminders.length;
    reminders = reminders.filter(reminder => reminder.id !== id);
    saveReminders();

    if (reminders.length === initialLength) {
        return `No reminder found with ID: ${id}`;
    } else {
        return `Reminder with ID ${id} has been removed.`;
    }
}

// Remove all reminders
function removeAllReminders() {
    reminders = [];
    saveReminders();
}

// Function to check and execute reminders
async function checkReminders(client) {
    const now = new Date();
    const newReminders = [];

    for (const reminder of reminders) {
        const reminderTime = new Date(reminder.time);
        if (now >= reminderTime) {
            const channel = client.channels.cache.get(reminder.channelId);
            const user = await client.users.fetch(reminder.userId);
            if (channel) {
                channel.send(`${user}, here's your reminder:\n\`\`\`${reminder.message}\`\`\``);
            }

            if (reminder.isInterval) {
                // Reschedule the interval reminder (e.g., repeat in 10 seconds)
                reminder.time = new Date(reminderTime.getTime() + 10000).toISOString(); // Adjust as needed
                newReminders.push(reminder);
            }
        } else {
            newReminders.push(reminder);
        }
    }

    reminders = newReminders;
    saveReminders();
}

// Periodically check reminders every 10 seconds
function setupReminders(client) {
    loadReminders();
    new CronJob('*/10 * * * * *', () => checkReminders(client), null, true, 'Europe/Berlin');
}

module.exports = {
    addReminder,
    removeReminderById,
    removeAllReminders,
    setupReminders,
};
