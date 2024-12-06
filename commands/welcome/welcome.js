const fs = require('fs');
const { EmbedBuilder, ChannelType } = require('discord.js');
const { checkPermission } = require('../../permissionChecker.js');

function replacePlaceholders(text, member, channel) {
    return text
        .replace('{user}', `<@${member.id}>`)
        .replace('{username}', member.user.username)
        .replace('{servername}', member.guild.name)
        .replace(/\{#(\w+)\}/g, (match, p1) => {
            const ch = member.guild.channels.cache.find(c => c.name === p1 || c.id === p1);
            return ch ? `<#${ch.id}>` : match;
        })
        .replace('{avatar}', member.user.displayAvatarURL())
        .replace('{server-icon}', member.guild.iconURL());
}

async function setWelcomeMessage(interaction) {
    const guildId = interaction.guildId;
    const commandName = 'welcome'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (hasPermission) {
        let message = interaction.options.getString('message');
        // Replace custom newline sequence with actual newlines
        message = message.replace(/~n~/g, '\n');

        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const thumbnail = interaction.options.getString('thumbnail');
        const imageUrl = interaction.options.getString('image_url');
        const guildId = interaction.guild.id;

        const welcomeSettings = JSON.parse(fs.readFileSync('./commands/welcome/welcomeSettings.json', 'utf-8') || '{}');
        welcomeSettings[guildId] = {
            message,
            channel: channel.id,
            title,
            thumbnail,
            imageUrl,
        };
        fs.writeFileSync('./commands/welcome/welcomeSettings.json', JSON.stringify(welcomeSettings, null, 2));

        await interaction.reply({ content: 'Welcome message set!', ephemeral: true });
    } else {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }
}


async function sendWelcomeMessage(member) {
    const guildId = member.guild.id;
    const welcomeSettings = JSON.parse(fs.readFileSync('./commands/welcome/welcomeSettings.json', 'utf-8') || '{}');
    const settings = welcomeSettings[guildId];

    if (!settings) return;

    const channel = member.guild.channels.cache.get(settings.channel);
    if (!channel || channel.type !== ChannelType.GuildText) return;

    let welcomeMessage = replacePlaceholders(settings.message, member, channel);
    // Replace custom newline sequence with actual newlines
    welcomeMessage = welcomeMessage.replace(/~n~/g, '\n');

    const embed = new EmbedBuilder()
        .setDescription(welcomeMessage)
        .setColor('#343434');

    if (settings.title) {
        embed.setTitle(replacePlaceholders(settings.title, member, channel));
    }
    if (settings.thumbnail) {
        embed.setThumbnail(replacePlaceholders(settings.thumbnail, member, channel));
    }
    if (settings.imageUrl) {
        embed.setImage(replacePlaceholders(settings.imageUrl, member, channel));
    }

    await channel.send({ embeds: [embed] });
}

module.exports = { setWelcomeMessage, sendWelcomeMessage };
