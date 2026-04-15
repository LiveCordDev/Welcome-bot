const { REST, Routes } = require('discord.js');
require('dotenv').config();
const config = require('./config');

const commands = [
    {
        name: 'help',
        description: 'Show all commands'
    },
    {
        name: 'ping',
        description: 'Check bot latency'
    },
    {
        name: 'serverinfo',
        description: 'Show server information'
    },
    {
        name: 'embed',
        description: 'Create, edit, or manage embeds',
        options: [
            {
                name: 'create',
                description: 'Create a new embed',
                type: 1,
                options: [
                    { name: 'name', description: 'Embed name (no spaces)', type: 3, required: true }
                ]
            },
            {
                name: 'edit',
                description: 'Edit an embed property',
                type: 1,
                options: [
                    { name: 'embed', description: 'Embed name', type: 3, required: true },
                    { name: 'property', description: 'Property to edit', type: 3, required: true,
                      choices: [
                          { name: 'Title', value: 'title' },
                          { name: 'Description', value: 'description' },
                          { name: 'Color', value: 'color' },
                          { name: 'Image', value: 'image' },
                          { name: 'Thumbnail', value: 'thumbnail' }
                      ] 
                    },
                    { name: 'value', description: 'New value', type: 3, required: true }
                ]
            },
            {
                name: 'edit_all',
                description: 'Edit all embed properties',
                type: 1,
                options: [
                    { name: 'embed', description: 'Embed name', type: 3, required: true }
                ]
            },
            {
                name: 'list',
                description: 'List all saved embeds',
                type: 1
            },
            {
                name: 'delete',
                description: 'Delete an embed',
                type: 1,
                options: [
                    { name: 'embed', description: 'Embed name', type: 3, required: true }
                ]
            },
            {
                name: 'show',
                description: 'Display an embed',
                type: 1,
                options: [
                    { name: 'embed', description: 'Embed name', type: 3, required: true }
                ]
            }
        ]
    },
    {
        name: 'welcome',
        description: 'Configure welcome messages',
        options: [
            {
                name: 'channel',
                description: 'Set welcome channel',
                type: 1,
                options: [
                    { name: 'channel', description: 'Channel', type: 7, required: true }
                ]
            },
            {
                name: 'toggle',
                description: 'Enable/disable welcome messages',
                type: 1,
                options: [
                    { name: 'enabled', description: 'true/false', type: 5, required: true }
                ]
            },
            {
                name: 'message',
                description: 'Set welcome message',
                type: 1,
                options: [
                    { name: 'text', description: 'Message (use {user}, {server})', type: 3, required: true }
                ]
            },
            {
                name: 'embed',
                description: 'Use a saved embed for welcome',
                type: 1,
                options: [
                    { name: 'name', description: 'Embed name', type: 3, required: true }
                ]
            }
        ]
    },
    {
        name: 'test',
        description: 'Test welcome message'
    }
];

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('📡 Registering global slash commands...');
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );
        console.log('✅ Slash commands registered globally!');
    } catch (error) {
        console.error(error);
    }
})();