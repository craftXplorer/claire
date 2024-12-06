const { EmbedBuilder } = require('discord.js');
const { Routes } = require('discord-api-types/v9');
const { checkPermission } = require('../../permissionChecker.js');


const colors = [
    { name: 'Red', value: '#ff0000' },
    { name: 'Pastel Red', value: '#ff8080' },
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Pastel Yellow', value: '#ffff80' },
    { name: 'Green', value: '#00ff00' },
    { name: 'Pastel Green', value: '#80ff80' },
    { name: 'Blue', value: '#0000ff' },
    { name: 'Pastel Blue', value: '#8080ff' },
    { name: 'Violet', value: '#8000ff' },
    { name: 'Pastel Violet', value: '#bf80ff' },
    { name: 'Pink', value: '#ff00bf' },
    { name: 'Pastel Pink', value: '#ff80df' },
    { name: 'Brown', value: '#663300' },
    { name: 'Light Brown', value: '#ac7339' },
    { name: 'Grey', value: '#333333' },
    { name: 'Light Grey', value: '#a6a6a6' },
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#ffffff' },
];

async function embedCommand(interaction) {
    const guildId = interaction.guildId;
    const commandName = 'embed'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (hasPermission) {
        const options = interaction.options;

        const title = options.getString('title') || '';
        const description = options.getString('description') || '';
        const author = options.getString('author') || '';
        const footer = options.getString('footer') || '';
    
        const titleMaxLength = 256;
        const descriptionMaxLength = 1999;
        const authorMaxLength = 256;
        const footerMaxLength = 256;
        const totalMaxLength = 2000;
    
        const totalLength = title.length + description.length + author.length + footer.length;
    
        if (title.length > titleMaxLength ||
            description.length > descriptionMaxLength ||
            author.length > authorMaxLength ||
            footer.length > footerMaxLength ||
            totalLength > totalMaxLength) {
    
            const errorMessage = [
                `**Title**: max ${titleMaxLength} characters.`,
                `**Description**: max ${descriptionMaxLength} characters.`,
                `**Author**: max ${authorMaxLength} characters.`,
                `**Footer**: max ${footerMaxLength} characters.`,
                `**Total length**: max ${totalMaxLength} characters.`
            ].join('\n');
    
            const usedCommand = [
                `/embed`,
                title ? `title: ${title}` : '',
                description ? `description: ${description}` : '',
                options.getString('color') ? `color: ${options.getString('color')}` : '',
                options.getString('thumbnail') ? `thumbnail: ${options.getString('thumbnail')}` : '',
                options.getString('image') ? `image: ${options.getString('image')}` : '',
                options.getString('title-url') ? `title-url: ${options.getString('title-url')}` : '',
                author ? `author: ${author}` : '',
                options.getString('author-icon') ? `author-icon: ${options.getString('author-icon')}` : '',
                footer ? `footer: ${footer}` : '',
                options.getString('footer-icon') ? `footer-icon: ${options.getString('footer-icon')}` : ''
            ].filter(Boolean).join(' ');
    
            let errorLength = `${errorMessage}**Your command:**\`${usedCommand}\``;
    
            // Ensure the total error message is within Discord's character limit (2000 characters)
            if (errorLength.length > 2000) {
                errorLength = errorLength.substring(0, 1996) + '...\n';
            }
    
            await interaction.reply({ content: errorLength, ephemeral: true });
            return;
        }
    
        const colorName = options.getString('color');
        const colorEntry = colorName ? colors.find(c => c.name.toLowerCase() === colorName.toLowerCase()) : null;
        const color = colorEntry ? colorEntry.value : '#0099ff'; // Default to blue if color is not found
    
        const thumbnail = options.getString('thumbnail');
        const image = options.getString('image');
        const titleUrl = options.getString('title-url');
        const authorIcon = options.getString('author-icon');
        const footerIcon = options.getString('footer-icon');
    
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color);
    
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (image) embed.setImage(image);
        if (titleUrl) embed.setURL(titleUrl);
        if (author) embed.setAuthor({ name: author, iconURL: authorIcon });
        if (footer) embed.setFooter({ text: footer, iconURL: footerIcon });
    
        await interaction.reply({ embeds: [embed] });
    } else {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }
}

module.exports = { embedCommand };
