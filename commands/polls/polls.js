const { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { checkPermission } = require('../../permissionChecker.js');

let polls = {};
let storedVoters = 'Poll not found.';

async function createPoll(interaction) {
    const guildId = interaction.guildId;
    const commandName = 'poll'; // Change this to the actual command name

    const hasPermission = checkPermission(guildId, commandName, interaction.member);

    if (hasPermission) {
        const question = interaction.options.getString('question');
        const option1 = interaction.options.getString('option-1');
        const option2 = interaction.options.getString('option-2');
        const option3 = interaction.options.getString('option-3');
        const option4 = interaction.options.getString('option-4');
        const option5 = interaction.options.getString('option-5');
        const anonymous = interaction.options.getBoolean('anonymous');
        const maxVotes = interaction.options.getInteger('max-votes') || 1;
    
        const pollOptions = [
            { label: option1, value: 'option-1', count: 0 },
            { label: option2, value: 'option-2', count: 0 },
        ];
        if (option3) pollOptions.push({ label: option3, value: 'option-3', count: 0 });
        if (option4) pollOptions.push({ label: option4, value: 'option-4', count: 0 });
        if (option5) pollOptions.push({ label: option5, value: 'option-5', count: 0 });
    
        const selectMenuOptions = pollOptions.map(option => new StringSelectMenuOptionBuilder().setLabel(option.label).setValue(option.value));
    
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('poll')
            .setPlaceholder('Choose an option')
            .addOptions(selectMenuOptions)
            .setMinValues(1) // Allow minimum selection
            .setMaxValues(maxVotes); // Allow maximum selection
    
        const row = new ActionRowBuilder()
            .addComponents(selectMenu);
    
        const endButton = new ButtonBuilder()
            .setCustomId('end_poll')
            .setLabel('End Poll')
            .setStyle(ButtonStyle.Danger);
    
        const showVotersButton = new ButtonBuilder()
            .setCustomId('show_voters')
            .setLabel('Show Voters')
            .setStyle(ButtonStyle.Primary);
    
        const buttonRow = new ActionRowBuilder()
            .addComponents(showVotersButton, endButton);
    
        polls[interaction.id] = {
            question,
            options: pollOptions,
            votes: {},
            anonymous,
            maxVotes,
            creator: interaction.user.id,
            message: null,
        };
    
        const embed = new EmbedBuilder()
            .setTitle('Poll in progress!')
            .setDescription(`# \`${question}\`\n\n## Current Results:\n*No votes*`)
            .setColor('#343434');
    
        interaction.reply({
            embeds: [embed],
            components: [row, buttonRow],
        }).then(msg => {
            polls[interaction.id].message = msg;
        });
    } else {
        await interaction.reply({ content: "You don't have permission to use this command.", ephemeral: true });
    }
}

async function handlePollVote(interaction) {
    const poll = polls[interaction.message.interaction.id];
    if (!poll) return;

    let userVotes = poll.votes[interaction.user.id] || [];

    if (poll.maxVotes === 1) {
        userVotes = [interaction.values[0]];
    } else {
        userVotes = [...userVotes, ...interaction.values].slice(-poll.maxVotes);
    }

    poll.votes[interaction.user.id] = userVotes;

    const optionsWithVotes = poll.options.map(option => {
        const count = Object.values(poll.votes).flat().filter(vote => vote === option.value).length;
        option.count = count;
        return option;
    });

    updatePollMessage(poll);

    if (!poll.anonymous) {
        await interaction.reply({ content: `You voted for ${poll.options.find(opt => opt.value === interaction.values[0]).label}`, ephemeral: true });
    } else {
        await interaction.reply({ content: 'Your vote has been recorded.', ephemeral: true });
    }
}

async function handleShowVoters(interaction) {
    const pollId = interaction.message.interaction.id;
    const poll = polls[pollId];

    if (!poll) {
        await interaction.reply({ content: 'Poll not found.', ephemeral: true });
        return;
    }

    if (poll.anonymous) {
        await interaction.reply({ content: 'Sorry, this poll is anonymous!', ephemeral: true });
        return;
    } else {
        let replyContent = 'Voters:\n';

        for (const option of poll.options) {
            replyContent += `**${option.label}**: `;
            const voters = Object.entries(poll.votes)
                .filter(([userId, votes]) => votes.includes(option.value))
                .map(([userId]) => `<@${userId}>`);
            replyContent += voters.length > 0 ? voters.join(', ') : 'None';
            replyContent += '\n';
        }

        await interaction.reply({ content: replyContent, ephemeral: true });
    }
}

async function handleShowVotersEnd(interaction) {
    await interaction.reply({ content: storedVoters, ephemeral: true });
}

async function handlePollEnd(interaction) {
    const poll = polls[interaction.message.interaction.id];
    if (!poll) {
        try {
            await interaction.reply({ content: 'Poll not found.', ephemeral: true });
            return;
        } catch {
            return;
        }
    }

    const pollId = interaction.message.interaction.id;
    const pollNew = polls[pollId];

    if (!pollNew) {
        await interaction.reply({ content: 'Poll not found.', ephemeral: true });
        return;
    }

    if (!poll.anonymous) {
        let replyContent = 'Voters:\n';

        for (const option of pollNew.options) {
            replyContent += `**${option.label}**: `;
            const voters = Object.entries(pollNew.votes)
                .filter(([userId, votes]) => votes.includes(option.value))
                .map(([userId]) => `<@${userId}>`);
            replyContent += voters.length > 0 ? voters.join(', ') : 'None';
            replyContent += '\n';
        }

        storedVoters = replyContent;
    } else {
        storedVoters = 'Sorry, this poll is anonymous!';
    }

    const maxLabelLength = Math.max(...poll.options.map(option => option.label.length));
    const totalVotes = Object.values(poll.votes).flat().length;
    const maxVoteLength = totalVotes.toString().length;

    const results = poll.options.map(option => {
        const count = option.count;
        const percentage = totalVotes ? ((count / totalVotes) * 100).toFixed(2).padStart(5, '0') : '00.00';
        const paddedCount = count.toString().padStart(maxVoteLength, '0');
        const paddedTotalVotes = totalVotes.toString().padStart(maxVoteLength, '0');
        const progressBar = '█'.repeat(Math.round(count / totalVotes * 10)) + '░'.repeat(10 - Math.round(count / totalVotes * 10));
        const paddedLabel = option.label.padEnd(maxLabelLength, ' ');
        return `${percentage}% [${paddedCount}/${paddedTotalVotes}] ${progressBar} - **${paddedLabel}**`;
    });

    const showVotersButton = new ButtonBuilder()
        .setCustomId('show_voters_end')
        .setLabel('Show Voters')
        .setStyle(ButtonStyle.Primary);

    const buttonRow = new ActionRowBuilder()
        .addComponents(showVotersButton);

    const embed = new EmbedBuilder()
        .setTitle('**Poll ended!**')
        .setDescription(`# \`${poll.question}\`\n\n### Results:\n${results.join('\n')}`)
        .setColor('#343434');

    await poll.message.edit({ content: '', embeds: [embed], components: [buttonRow] });

    delete polls[interaction.message.interaction.id];
}


async function updatePollMessage(poll) {
    const maxLabelLength = Math.max(...poll.options.map(option => option.label.length));
    const totalVotes = Object.values(poll.votes).flat().length;
    const maxVoteLength = totalVotes.toString().length;

    const results = poll.options.map(option => {
        const count = option.count;
        const percentage = totalVotes ? ((count / totalVotes) * 100).toFixed(2).padStart(5, '0') : '00.00';
        const paddedCount = count.toString().padStart(maxVoteLength, '0');
        const paddedTotalVotes = totalVotes.toString().padStart(maxVoteLength, '0');
        const progressBar = '█'.repeat(Math.round(count / totalVotes * 10)) + '░'.repeat(10 - Math.round(count / totalVotes * 10));
        const paddedLabel = option.label.padEnd(maxLabelLength, ' ');
        return `${percentage}% [${paddedCount}/${paddedTotalVotes}] ${progressBar} - **${paddedLabel}**`;
    });

    const embed = new EmbedBuilder()
        .setTitle('**Poll in progress!**')
        .setDescription(`# \`${poll.question}\`\n\n### Current results:\n${results.join('\n')}`)
        .setColor('#343434');

    await poll.message.edit({ content: '', embeds: [embed] });
}

module.exports = { createPoll, handlePollVote, handleShowVoters, handlePollEnd, handleShowVotersEnd };
