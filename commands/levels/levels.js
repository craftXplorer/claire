const fs = require('fs');
const path = require('path');

const levelDataPath = path.join(__dirname, 'level-data.json');
const levelMessagesPath = path.join(__dirname, 'level-messages.json');

// Function to toggle the level system
async function levelsToggle(interaction) {
    const guildId = interaction.guildId;
    try {
        let levelData = {};
        if (fs.existsSync(levelDataPath)) {
            const data = fs.readFileSync(levelDataPath);
            levelData = JSON.parse(data);
        }

        if (!levelData[guildId]) {
            levelData[guildId] = { enabled: false };
        }

        levelData[guildId].enabled = !levelData[guildId].enabled;

        fs.writeFileSync(levelDataPath, JSON.stringify(levelData, null, 4));

        await interaction.reply(`Level system ${levelData[guildId].enabled ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
        console.error('Error toggling level system:', error);
        await interaction.reply({ content: 'Failed to toggle the level system. Please try again later.', ephemeral: true });
    }
}

// Function to set custom level-up messages
async function levelsMessage(interaction) {
    const guildId = interaction.guildId;
    const level = interaction.options.getInteger('level');
    const message = interaction.options.getString('message');

    try {
        let levelMessages = {};
        if (fs.existsSync(levelMessagesPath)) {
            const data = fs.readFileSync(levelMessagesPath);
            levelMessages = JSON.parse(data);
        }

        if (!levelMessages[guildId]) {
            levelMessages[guildId] = {};
        }

        levelMessages[guildId][level] = message;

        fs.writeFileSync(levelMessagesPath, JSON.stringify(levelMessages, null, 4));

        await interaction.reply(`Level-up message for level ${level} set successfully!`);
    } catch (error) {
        console.error('Error setting level-up message:', error);
        await interaction.reply({ content: 'Failed to set level-up message. Please try again later.', ephemeral: true });
    }
}

// Function to handle leveling logic
async function handleLeveling(interaction) {
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    try {
        let levelData = {};
        if (fs.existsSync(levelDataPath)) {
            const data = fs.readFileSync(levelDataPath);
            levelData = JSON.parse(data);
        }

        if (!levelData[guildId] || !levelData[guildId].enabled) {
            return; // Leveling system is not enabled for this guild
        }

        if (!levelData[guildId][userId]) {
            levelData[guildId][userId] = { level: 0, xp: 0 };
        }

        const userLevelData = levelData[guildId][userId];
        userLevelData.xp += 1; // Increment XP by 1 for every message

        const xpToNextLevel = userLevelData.level * 10 + 10; // Example XP threshold calculation

        if (userLevelData.xp >= xpToNextLevel) {
            userLevelData.level += 1;
            userLevelData.xp = 0; // Reset XP for the next level

            // Load level messages
            let levelMessages = {};
            if (fs.existsSync(levelMessagesPath)) {
                const data = fs.readFileSync(levelMessagesPath);
                levelMessages = JSON.parse(data);
            }

            const levelMessage = levelMessages[guildId]?.[userLevelData.level] || `Congratulations <@${userId}>! You have reached level ${userLevelData.level}.`;

            await interaction.channel.send(levelMessage);
        }

        fs.writeFileSync(levelDataPath, JSON.stringify(levelData, null, 4));
    } catch (error) {
        console.error('Error handling leveling:', error);
    }
}

module.exports = { levelsToggle, levelsMessage, handleLeveling };
