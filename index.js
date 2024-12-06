const { Client, GatewayIntentBits, ActivityType, Events, MessageType, Partials } = require('discord.js');
const axios = require('axios');
const { Logger, LogLevel } = require('meklog')
const path = require('path');
const { dotenv } = require('dotenv')
require('dotenv').config();
require('dotenv/config')
const { embedCommand } = require('./commands/embed/embed.js');
const { reminderCommands, removeReminder, removeAll } = require('./commands/reminder/reminderCommands.js');
const { setupReminders } = require('./commands/reminder/reminder.js');
const { createPoll, handlePollVote, handlePollEnd, handleShowVoters, handleShowVotersEnd } = require('./commands/polls/polls.js');
const { helpCommand } = require('./commands/help/help.js');
const { aiSetChannelCommand } = require('./commands/ai/ai-setchannel.js');
const { updateChannelsVariable } = require('./updateChannels');
const { setWelcomeMessage, sendWelcomeMessage } = require('./commands/welcome/welcome.js');
const { data: simulateJoinData, run: simulateJoinRun } = require('./commands/simulateJoin/simulate-join.js');
const { sendPlaceholders } = require('./commands/placeholders/placeholders.js');
const { welcomeRemoveCommand } = require('./commands/welcome/welcome-remove.js');
const { permsCommand } = require('./commands/perms/perms');
const fs = require('fs');
const { permsListCommand } = require('./commands/perms/permsList.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
    allowedMentions: { users: [], roles: [], repliedUser: false },
    partials: [
        Partials.Channel
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1245736150270873690';
const GUILD_IDS = [process.env.GUILD_IDS];

const statuses = [
    { name: "Try /ai-setchannel", type: ActivityType.Custom },
    { name: "Chat with me! /ai-setchannel", type: ActivityType.Custom },
    { name: "Try /embed", type: ActivityType.Custom },
    { name: "Try /help", type: ActivityType.Custom },
    { name: "Try /perms", type: ActivityType.Custom },
    { name: "Try /perms-list", type: ActivityType.Custom },
    { name: "Try /placeholders", type: ActivityType.Custom },
    { name: "Try /poll", type: ActivityType.Custom },
    { name: "Try /reminder", type: ActivityType.Custom },
    { name: "Try /reminder-remove", type: ActivityType.Custom },
    { name: "Try /reminder-remove-all", type: ActivityType.Custom },
    { name: "Try /simulate-join", type: ActivityType.Custom },
    { name: "Try /welcome", type: ActivityType.Custom },
    { name: "Try /welcome-remove", type: ActivityType.Custom },
    { name: "Under Development", type: ActivityType.Custom },
    { name: "Under Development", type: ActivityType.Custom },
];

// Utility function to update the .env file with a new guild ID
function updateEnvWithGuildId(newGuildId) {
    const envFilePath = path.resolve(__dirname, '.env');
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    const envLines = envContent.split('\n');

    const guildIdLineIndex = envLines.findIndex(line => line.startsWith('GUILD_IDS='));
    if (guildIdLineIndex !== -1) {
        const currentGuildIds = envLines[guildIdLineIndex].split('=')[1].split(',').map(id => id.trim());
        if (!currentGuildIds.includes(newGuildId)) {
            currentGuildIds.push(newGuildId);
            envLines[guildIdLineIndex] = `GUILD_IDS=${currentGuildIds.join(',')}`;
        }
    } else {
        envLines.push(`GUILD_IDS=${newGuildId}`);
    }

    fs.writeFileSync(envFilePath, envLines.join('\n'), 'utf8');
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    setInterval(() => {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        client.user.setPresence({
            activities: [{
                name: randomStatus.name,
                type: randomStatus.type,
            }],
            status: 'idle'
        });
    }, 20000); // Change presence every 20 seconds

    client.application.commands.set([]);

    setupReminders(client);
    refreshCommands();

});

client.on('guildCreate', guild => {
    console.log(`Joined new guild: ${guild.id}`);
    updateEnvWithGuildId(guild.id);
    refreshCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    switch (interaction.commandName) {
        case 'embed':
            await embedCommand(interaction);
            break;
        case 'reminder':
            await reminderCommands(interaction);
            break;
        case 'reminder-remove':
            await removeReminder(interaction);
            break;
        case 'reminder-remove-all':
            await removeAll(interaction);
            break;
        case 'poll': // Add the poll case
            await createPoll(interaction);
            break;
        case 'help': // Add the help case
            await helpCommand(interaction);
            break;
        case 'ai-setchannel': // Add the ai-setchannel case
            await aiSetChannelCommand(interaction);
            await refreshChannels()
            break;
        case 'welcome':
            await setWelcomeMessage(interaction);
            break;
        case 'simulate-join':
            await simulateJoinRun({ interaction, client });
            break;
        case 'placeholders': // Add the placeholders case
            await sendPlaceholders({ interaction });
            break;
        case 'welcome-remove':
            await welcomeRemoveCommand(interaction);
            break;
        case 'perms':
            await permsCommand(interaction);
            break;
        case 'perms-list':
            await permsListCommand(interaction);
            break;
        // Add more commands here if needed
    }
});

client.on(Events.GuildMemberAdd, async member => {
    await sendWelcomeMessage(member);
});

client.on('interactionCreate', async interaction => {
    if (interaction.isStringSelectMenu() && interaction.customId === 'poll') {
        await handlePollVote(interaction);
    } else if (interaction.isButton() && interaction.customId === 'end_poll') {
        await handlePollEnd(interaction);
    }
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isButton()) {
            switch (interaction.customId) {
                case 'poll':
                    await handlePollVote(interaction);
                    break;
                case 'end_poll':
                    await handlePollEnd(interaction);
                    break;
                case 'show_voters':
                    await handleShowVoters(interaction);
                    break;
                case 'show_voters_end':
                    await handleShowVotersEnd(interaction);
                    break;
            }
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        await interaction.reply({ content: 'An error occurred while handling your interaction.', ephemeral: true });
    }
});


const model = process.env.MODEL;
const servers = process.env.OLLAMA.split(",").map(url => ({ url: new URL(url), available: true }));
let channels = process.env.CHANNELS.split(",");

async function refreshChannels() {
    channels = await updateChannelsVariable();
}

if (servers.length == 0) {
    throw new Error("No servers available");
}

let log = (level, message) => {
    console.log(`[${level}] ${message}`);
};

process.on("message", data => {
    if (data.shardID) client.shardID = data.shardID;
    if (data.logger) log = new Logger(data.logger);
});

const logError = (error) => {
    if (error.response) {
        let str = `Error ${error.response.status} ${error.response.statusText}: ${error.request.method} ${error.request.path}`;
        if (error.response.data?.error) {
            str += ": " + error.response.data.error;
        }
        log(LogLevel.Error, str);
    } else {
        log(LogLevel.Error, error);
    }
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function makeRequest(path, method, data) {
    while (servers.filter(server => server.available).length == 0) {
        // wait until a server is available
        await new Promise(res => setTimeout(res, 1000));
    }

    let error = null;
    // randomly loop through the servers available, don't shuffle the actual array because we want to be notified of any updates
    let order = new Array(servers.length).fill().map((_, i) => i);
    if (randomServer) order = shuffleArray(order);
    for (const j in order) {
        if (!order.hasOwnProperty(j)) continue;
        const i = order[j];
        // try one until it succeeds
        try {
            // make a request to ollama
            if (!servers[i].available) continue;
            const url = new URL(servers[i].url); // don't modify the original URL

            servers[i].available = false;

            if (path.startsWith("/")) path = path.substring(1);
            if (!url.pathname.endsWith("/")) url.pathname += "/"; // safety
            url.pathname += path;
            log(LogLevel.Debug, `Making request to ${url}`);
            const result = await axios({
                method, url, data,
                responseType: "text"
            });
            servers[i].available = true;
            return result.data;
        } catch (err) {
            servers[i].available = true;
            error = err;
            logError(error);
        }
    }
    if (!error) {
        throw new Error("No servers available");
    }
    throw error;
}

client.once(Events.ClientReady, async () => {
    await client.guilds.fetch();
});

const messages = {};

// split text so it fits in a Discord message
function splitText(str, length) {
    // trim matches different characters to \s
    str = str
        .replace(/\r\n/g, "\n").replace(/\r/g, "\n")
        .replace(/^\s+|\s+$/g, "");
    const segments = [];
    let segment = "";
    let word, suffix;
    function appendSegment() {
        segment = segment.replace(/^\s+|\s+$/g, "");
        if (segment.length > 0) {
            segments.push(segment);
            segment = "";
        }
    }
    // match a word
    while ((word = str.match(/^[^\s]*(?:\s+|$)/)) != null) {
        suffix = "";
        word = word[0];
        if (word.length == 0) break;
        if (segment.length + word.length > length) {
            // prioritise splitting by newlines over other whitespaces
            if (segment.includes("\n")) {
                // append up all but last paragraph
                const beforeParagraph = segment.match(/^.*\n/s);
                if (beforeParagraph != null) {
                    const lastParagraph = segment.substring(beforeParagraph[0].length, segment.length);
                    segment = beforeParagraph[0];
                    appendSegment();
                    segment = lastParagraph;
                    continue;
                }
            }
            appendSegment();
            // if word is larger than the split length
            if (word.length > length) {
                word = word.substring(0, length);
                if (length > 1 && word.match(/^[^\s]+$/)) {
                    // try to hyphenate word
                    word = word.substring(0, word.length - 1);
                    suffix = "-";
                }
            }
        }
        str = str.substring(word.length, str.length);
        segment += word + suffix;
    }
    appendSegment();
    return segments;
}

function getBoolean(str) {
    return !!str && str != "false" && str != "no" && str != "off" && str != "0";
}

function parseJSONMessage(str) {
    return str.split(/[\r\n]+/g).map(function (line) {
        const result = JSON.parse(`"${line}"`);
        if (typeof result !== "string") throw new "Invalid syntax in .env file";
        return result;
    }).join("\n");
}

function parseEnvString(str) {
    return typeof str === "string" ?
        parseJSONMessage(str).replace(/<date>/gi, new Date().toUTCString()) : null;
}

const customSystemMessage = parseEnvString(process.env.SYSTEM);
const useCustomSystemMessage = getBoolean(process.env.USE_SYSTEM) && !!customSystemMessage;
const useModelSystemMessage = getBoolean(process.env.USE_MODEL_SYSTEM);
const showStartOfConversation = getBoolean(process.env.SHOW_START_OF_CONVERSATION);
const randomServer = getBoolean(process.env.RANDOM_SERVER);
let modelInfo = null;
const initialPrompt = parseEnvString(process.env.INITIAL_PROMPT);
const useInitialPrompt = getBoolean(process.env.USE_INITIAL_PROMPT) && !!initialPrompt;

const requiresMention = getBoolean(process.env.REQUIRES_MENTION);

async function replySplitMessage(replyMessage, content) {
    const responseMessages = splitText(content, 2000).map(content => ({ content }));

    const replyMessages = [];
    for (let i = 0; i < responseMessages.length; ++i) {
        if (i == 0) {
            replyMessages.push(await replyMessage.reply(responseMessages[i]));
        } else {
            replyMessages.push(await replyMessage.channel.send(responseMessages[i]));
        }
    }
    return replyMessages;
}

client.on(Events.MessageCreate, async message => {
    let typing = false;
    try {
        await message.fetch();

        // return if not in the right channel
        const channelID = message.channel.id;
        if (message.guild && !channels.includes(channelID)) return;

        // return if user is a bot, or non-default message
        if (!message.author.id) return;
        if (message.author.bot || message.author.id == client.user.id) return;

        const botRole = message.guild?.members?.me?.roles?.botRole;
        const myMention = new RegExp(`<@((!?${client.user.id}${botRole ? `)|(&${botRole.id}` : ""}))>`, "g"); // RegExp to match a mention for the bot

        if (typeof message.content !== "string" || message.content.length == 0) {
            return;
        }

        let context = null;
        if (message.type == MessageType.Reply) {
            const reply = await message.fetchReference();
            if (!reply) return;
            if (reply.author.id != client.user.id) return;
            if (messages[channelID] == null) return;
            if ((context = messages[channelID][reply.id]) == null) return;
        } else if (message.type != MessageType.Default) {
            return;
        }

        // fetch info about the model like the template and system message
        if (modelInfo == null) {
            modelInfo = (await makeRequest("/api/show", "post", {
                name: model
            }));
            if (typeof modelInfo === "string") modelInfo = JSON.parse(modelInfo);
            if (typeof modelInfo !== "object") throw "failed to fetch model information";
        }

        const systemMessages = [];

        if (useModelSystemMessage && modelInfo.system) {
            systemMessages.push(modelInfo.system);
        }

        if (useCustomSystemMessage) {
            systemMessages.push(customSystemMessage);
        }

        // join them together
        const systemMessage = systemMessages.join("\n\n");

        // deal with commands first before passing to LLM
        let userInput = message.content
            .replace(new RegExp("^\s*" + myMention.source, ""), "").trim();

        // may change this to slash commands in the future
        // i'm using regular text commands currently because the bot interacts with text content anyway
        if (userInput.startsWith(".")) {
            const args = userInput.substring(1).split(/\s+/g);
            const cmd = args.shift();
            switch (cmd) {
                case "reset":
                case "clear":
                    if (messages[channelID] != null) {
                        // reset conversation
                        const cleared = messages[channelID].amount;

                        // clear
                        delete messages[channelID];

                        if (cleared > 0) {
                            await message.reply({ content: `Cleared conversation of ${cleared} messages` });
                            break;
                        }
                    }
                    await message.reply({ content: "No messages to clear" });
                    break;
                case "help":
                case "?":
                case "h":
                    await message.reply({ content: "Commands:\n- `.reset` `.clear`\n- `.help` `.?` `.h`\n- `.ping`\n- `.model`\n- `.system`" });
                    break;
                case "model":
                    await message.reply({
                        content: `Current model: ${model}`
                    });
                    break;
                case "system":
                    await replySplitMessage(message, `System message:\n\n${systemMessage}`);
                    break;
                case "ping":
                    // get ms difference
                    const beforeTime = Date.now();
                    const reply = await message.reply({ content: "Ping" });
                    const afterTime = Date.now();
                    const difference = afterTime - beforeTime;
                    await reply.edit({ content: `Ping: ${difference}ms` });
                    break;
                case "":
                    break;
                default:
                    await message.reply({ content: "Unknown command, type `.help` for a list of commands" });
                    break;
            }
            return;
        }

        if (message.type == MessageType.Default && (requiresMention && message.guild && !message.content.match(myMention))) return;

        if (message.guild) {
            await message.guild.channels.fetch();
            await message.guild.members.fetch();
        }

        userInput = userInput
            .replace(myMention, "")
            .replace(/<#([0-9]+)>/g, (_, id) => {
                if (message.guild) {
                    const chn = message.guild.channels.cache.get(id);
                    if (chn) return `#${chn.name}`;
                }
                return "#unknown-channel";
            })
            .replace(/<@!?([0-9]+)>/g, (_, id) => {
                if (id == message.author.id) return message.author.username;
                if (message.guild) {
                    const mem = message.guild.members.cache.get(id);
                    if (mem) return `@${mem.user.username}`;
                }
                return "@unknown-user";
            })
            .replace(/<:([a-zA-Z0-9_]+):([0-9]+)>/g, (_, name) => {
                return `emoji:${name}:`;
            })
            .trim();

        if (userInput.length == 0) return;

        // create conversation
        if (messages[channelID] == null) {
            messages[channelID] = { amount: 0, last: null };
        }

        // log user's message
        log(LogLevel.Debug, `${message.guild ? `#${message.channel.name}` : "DMs"} - ${message.author.username}: ${userInput}`);

        // start typing
        typing = true;
        await message.channel.sendTyping();
        let typingInterval = setInterval(async () => {
            try {
                await message.channel.sendTyping();
            } catch (error) {
                if (typingInterval != null) {
                    clearInterval(typingInterval);
                }
                typingInterval = null;
            }
        }, 7000);

        let response;
        try {
            // context if the message is not a reply
            if (context == null) {
                context = messages[channelID].last;
            }

            if (useInitialPrompt && messages[channelID].amount == 0) {
                userInput = `${initialPrompt}\n\n${userInput}`;
                log(LogLevel.Debug, "Adding initial prompt to message");
            }

            // make request to model
            response = (await makeRequest("/api/generate", "post", {
                model: model,
                prompt: userInput,
                system: systemMessage,
                context
            }));

            if (typeof response != "string") {
                log(LogLevel.Debug, response);
                throw new TypeError("response is not a string, this may be an error with ollama");
            }

            response = response.split("\n").filter(e => !!e).map(e => {
                return JSON.parse(e);
            });
        } catch (error) {
            if (typingInterval != null) {
                clearInterval(typingInterval);
            }
            typingInterval = null;
            throw error;
        }

        if (typingInterval != null) {
            clearInterval(typingInterval);
        }
        typingInterval = null;

        let responseText = response.map(e => e.response).filter(e => e != null).join("").trim();
        if (responseText.length == 0) {
            responseText = "(No response)";
        }

        log(LogLevel.Debug, `Response: ${responseText}`);

        const prefix = showStartOfConversation && messages[channelID].amount == 0 ?
            "> This is the beginning of the conversation, type `.help` for help.\n\n" : "";

        // reply (will automatically stop typing)
        const replyMessageIDs = (await replySplitMessage(message, `${prefix}${responseText}`)).map(msg => msg.id);

        // add response to conversation
        context = response.filter(e => e.done && e.context)[0].context;
        for (let i = 0; i < replyMessageIDs.length; ++i) {
            messages[channelID][replyMessageIDs[i]] = context;
        }
        messages[channelID].last = context;
        ++messages[channelID].amount;
    } catch (error) {
        if (typing) {
            try {
                // return error
                await message.reply({ content: "Error, please check the console" });
            } catch (ignored) { }
        }
        logError(error);
    }
});

client.login(process.env.TOKEN);

async function refreshCommands() {
    const { REST } = require('@discordjs/rest');
    const { Routes } = require('discord-api-types/v9');

    const rest = new REST({ version: '9' }).setToken(TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            {
                body: []
            }
        );

        // Register guild commands for each guild ID
        const guildIds = process.env.GUILD_IDS.split(',');
        for (const guildId of guildIds) {

            await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, guildId),
                {
                    body: [
                        {
                            name: 'embed',
                            description: 'Creates an embed',
                            options: [
                                {
                                    name: 'title',
                                    description: 'The title of the embed',
                                    type: 3, // STRING
                                    required: true,
                                },
                                {
                                    name: 'description',
                                    description: 'The description/main part of the embed',
                                    type: 3, // STRING
                                    required: true,
                                },
                                {
                                    name: 'color',
                                    description: 'The color of the embed. Default: Red',
                                    type: 3, // STRING
                                    required: false,
                                    choices: [
                                        { name: 'Red', value: 'Red' },
                                        { name: 'Pastel Red', value: 'Pastel Red' },
                                        { name: 'Yellow', value: 'Yellow' },
                                        { name: 'Pastel Yellow', value: 'Pastel Yellow' },
                                        { name: 'Green', value: 'Green' },
                                        { name: 'Pastel Green', value: 'Pastel Green' },
                                        { name: 'Blue', value: 'Blue' },
                                        { name: 'Pastel Blue', value: 'Pastel Blue' },
                                        { name: 'Violet', value: 'Violet' },
                                        { name: 'Pastel Violet', value: 'Pastel Violet' },
                                        { name: 'Pink', value: 'Pink' },
                                        { name: 'Pastel Pink', value: 'Pastel Pink' },
                                        { name: 'Brown', value: 'Brown' },
                                        { name: 'Light Brown', value: 'Light Brown' },
                                        { name: 'Grey', value: 'Grey' },
                                        { name: 'Light Grey', value: 'Light Grey' },
                                        { name: 'Black', value: 'Black' },
                                        { name: 'White', value: 'White' },
                                    ],
                                },
                                {
                                    name: 'thumbnail',
                                    description: 'The thumbnail URL of the embed',
                                    type: 3, // STRING
                                    required: false,
                                },
                                {
                                    name: 'image',
                                    description: 'The image URL of the embed',
                                    type: 3, // STRING
                                    required: false,
                                },
                                {
                                    name: 'title-url',
                                    description: 'The URL of the title',
                                    type: 3, // STRING
                                    required: false,
                                },
                                {
                                    name: 'author',
                                    description: 'The author of the embed',
                                    type: 3, // STRING
                                    required: false,
                                },
                                {
                                    name: 'author-icon',
                                    description: 'The author icon URL',
                                    type: 3, // STRING
                                    required: false,
                                },
                                {
                                    name: 'footer',
                                    description: 'The footer text',
                                    type: 3, // STRING
                                    required: false,
                                },
                                {
                                    name: 'footer-icon',
                                    description: 'The footer icon URL',
                                    type: 3, // STRING
                                    required: false,
                                },
                            ],
                        },
                        {
                            name: 'reminder',
                            description: 'Set a reminder',
                            options: [
                                {
                                    name: 'days',
                                    description: 'Days until the reminder',
                                    type: 4, // INTEGER
                                    required: true,
                                },
                                {
                                    name: 'hours',
                                    description: 'Hours until the reminder',
                                    type: 4, // INTEGER
                                    required: true,
                                },
                                {
                                    name: 'minutes',
                                    description: 'Minutes until the reminder',
                                    type: 4, // INTEGER
                                    required: true,
                                },
                                {
                                    name: 'seconds',
                                    description: 'Seconds until the reminder',
                                    type: 4, // INTEGER
                                    required: true,
                                },
                                {
                                    name: 'message',
                                    description: 'Reminder message',
                                    type: 3, // STRING
                                    required: true,
                                },
                                {
                                    name: 'type',
                                    description: 'Type of reminder (interval or single)',
                                    type: 5, // BOOLEAN
                                    required: true,
                                },
                            ],
                        },
                        {
                            name: 'reminder-remove',
                            description: 'Remove a reminder by its ID',
                            options: [
                                {
                                    name: 'id',
                                    description: 'The ID of the reminder to remove',
                                    type: 3, // STRING
                                    required: true,
                                },
                            ],
                        },
                        {
                            name: 'reminder-remove-all',
                            description: 'Remove all reminders',
                            options: [],
                        },
                        {
                            name: 'poll',
                            description: 'Create a poll',
                            options: [
                                {
                                    name: 'question',
                                    description: 'The question for the poll',
                                    type: 3, // STRING
                                    required: true,
                                },
                                {
                                    name: 'option-1',
                                    description: 'First option for the poll',
                                    type: 3, // STRING
                                    required: true,
                                },
                                {
                                    name: 'option-2',
                                    description: 'Second option for the poll',
                                    type: 3, // STRING
                                    required: true,
                                },
                                {
                                    name: 'option-3',
                                    description: 'Third option for the poll',
                                    type: 3, // STRING,
                                    required: false,
                                },
                                {
                                    name: 'option-4',
                                    description: 'Fourth option for the poll',
                                    type: 3, // STRING,
                                    required: false,
                                },
                                {
                                    name: 'option-5',
                                    description: 'Fifth option for the poll',
                                    type: 3, // STRING,
                                    required: false,
                                },
                                {
                                    name: 'anonymous',
                                    description: 'Whether the poll is anonymous. Default: false',
                                    type: 5, // BOOLEAN
                                    required: false,
                                },
                                {
                                    name: 'max-votes',
                                    description: 'Maximum number of votes per user. Default: 1',
                                    type: 4, // INTEGER
                                    required: false,
                                },
                            ],
                        },
                        {
                            name: 'help',
                            description: 'Displays a list of available commands',
                            options: []
                        },
                        {
                            name: 'ai-setchannel',
                            description: 'Add a channel ID for Claire-AI.',
                            options: [
                                {
                                    name: 'channel',
                                    description: 'The channel to add',
                                    type: 7, // CHANNEL type
                                    required: true,
                                }
                            ]
                        },
                        {
                            name: 'welcome',
                            description: 'Set the welcome message. For placeholders: /placeholders',
                            options: [
                                {
                                    name: 'title',
                                    type: 3, // STRING
                                    description: 'Title of the welcome message. For placeholders: /placeholders',
                                    required: true
                                },
                                {
                                    name: 'message',
                                    type: 3, // STRING
                                    description: 'The welcome message. For placeholders: /placeholders',
                                    required: true
                                },
                                {
                                    name: 'channel',
                                    type: 7, // CHANNEL
                                    description: 'The channel to send the welcome message',
                                    required: true
                                },
                                {
                                    name: 'thumbnail',
                                    type: 3, // STRING
                                    description: 'Thumbnail URL of the welcome message. For placeholders: /placeholders',
                                    required: false
                                },
                                {
                                    name: 'image_url',
                                    type: 3, // STRING
                                    description: 'Image URL of the welcome message. For placeholders: /placeholders',
                                    required: false
                                }
                            ]
                        },
                        {
                            name: 'simulate-join',
                            description: 'Simulate user join event. Developers only!',
                            options: [
                                {
                                    name: 'target-user',
                                    type: 6,
                                    description: 'The user to mention',
                                    required: false
                                }
                            ]
                        },
                        {
                            name: 'placeholders',
                            description: 'View the available placeholders.',
                            options: []
                        },
                        {
                            name: 'welcome-remove',
                            description: 'Remove the welcome message',
                            options: []
                        },
                        {
                            name: 'perms',
                            description: 'Define who can use which commands',
                            options: [
                                {
                                    name: 'command',
                                    description: 'Which command permissions to alter',
                                    type: 3, // STRING
                                    required: true,
                                    choices: [
                                        { name: '/ai-setchannel', value: 'ai-setchannel' },
                                        { name: '/embed', value: 'embed' },
                                        { name: '/help', value: 'help' },
                                        { name: '/perms', value: 'perms' },
                                        { name: '/perms-list', value: 'perms-list' },
                                        { name: '/placeholders', value: 'placeholders' },
                                        { name: '/poll', value: 'poll' },
                                        { name: '/reminder', value: 'reminder' },
                                        { name: '/reminder-remove', value: 'reminder-remove' },
                                        { name: '/reminder-remove-all', value: 'reminder-remove-all' },
                                        { name: '/simulate-join', value: 'simulate-join' },
                                        { name: '/welcome', value: 'welcome' },
                                        { name: '/welcome-remove', value: 'welcome-remove' },
                                    ],
                                },
                                {
                                    name: 'role-ids',
                                    type: 3,
                                    description: 'Which roles to allow. Seperate with commas',
                                    required: true
                                }
                            ]
                        },
                        {
                            name: 'perms-list',
                            description: 'List all command permissions',
                            options: []
                        }
                    ],
                }
            );
        }

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}
