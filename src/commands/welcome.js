const { SlashCommandBuilder } = require('discord.js');
const { setWelcomeSettings, getWelcomeSettings, getEmbed } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure welcome messages')
        .addSubcommand(sub => sub.setName('channel').setDescription('Set welcome channel').addChannelOption(opt => opt.setName('channel').setDescription('Channel').setRequired(true)))
        .addSubcommand(sub => sub.setName('toggle').setDescription('Enable/disable welcome').addBooleanOption(opt => opt.setName('enabled').setDescription('true/false').setRequired(true)))
        .addSubcommand(sub => sub.setName('message').setDescription('Set welcome message').addStringOption(opt => opt.setName('text').setDescription('Use {user}, {server}').setRequired(true)))
        .addSubcommand(sub => sub.setName('embed').setDescription('Use saved embed').addStringOption(opt => opt.setName('name').setDescription('Embed name').setRequired(true))),
    
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        
        if (sub === 'channel') {
            const channel = interaction.options.getChannel('channel');
            await setWelcomeSettings(interaction.guildId, { channelId: channel.id });
            return interaction.reply(`✅ Welcome channel set to ${channel}`);
        }
        
        if (sub === 'toggle') {
            const enabled = interaction.options.getBoolean('enabled');
            await setWelcomeSettings(interaction.guildId, { enabled });
            return interaction.reply(`✅ Welcome ${enabled ? 'enabled' : 'disabled'}`);
        }
        
        if (sub === 'message') {
            const text = interaction.options.getString('text');
            await setWelcomeSettings(interaction.guildId, { message: text, embedName: null });
            return interaction.reply(`✅ Welcome message set!\nPreview: ${text.replace('{user}', `<@${interaction.user.id}>`).replace('{server}', interaction.guild.name)}`);
        }
        
        if (sub === 'embed') {
            const name = interaction.options.getString('name');
            const embedData = await getEmbed(interaction.guildId, name);
            if (!embedData) return interaction.reply({ content: '❌ Embed not found!', ephemeral: true });
            await setWelcomeSettings(interaction.guildId, { embedName: name, message: null });
            return interaction.reply(`✅ Welcome embed set to **${name}**`);
        }
    }
};