const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { getEmbed, getAllEmbeds, deleteEmbed, saveEmbed } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create, edit, or manage embeds')
        .addSubcommand(sub => sub.setName('create').setDescription('Create a new embed').addStringOption(opt => opt.setName('name').setDescription('Embed name').setRequired(true)))
        .addSubcommand(sub => sub.setName('list').setDescription('List all saved embeds'))
        .addSubcommand(sub => sub.setName('delete').setDescription('Delete an embed').addStringOption(opt => opt.setName('name').setDescription('Embed name').setRequired(true)))
        .addSubcommand(sub => sub.setName('show').setDescription('Show an embed').addStringOption(opt => opt.setName('name').setDescription('Embed name').setRequired(true))),
    
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const name = interaction.options.getString('name');
        
        if (sub === 'create') {
            const existing = await getEmbed(interaction.guildId, name);
            if (existing) {
                return interaction.reply({ content: '❌ Embed already exists!', ephemeral: true });
            }
            await saveEmbed(interaction.guildId, name, {
                title: 'New Embed',
                description: 'Edit this embed using `/embed edit`',
                color: config.embedColor
            });
            return interaction.reply(`✅ Embed **${name}** created!`);
        }
        
        if (sub === 'list') {
            const embeds = await getAllEmbeds(interaction.guildId);
            const names = Object.keys(embeds);
            if (names.length === 0) return interaction.reply({ content: '❌ No embeds found.', ephemeral: true });
            
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('📦 Saved Embeds')
                .setDescription(names.map(n => `• ${n}`).join('\n'));
            return interaction.reply({ embeds: [embed] });
        }
        
        if (sub === 'delete') {
            const deleted = await deleteEmbed(interaction.guildId, name);
            if (deleted) {
                return interaction.reply(`✅ Embed **${name}** deleted!`);
            }
            return interaction.reply({ content: '❌ Embed not found!', ephemeral: true });
        }
        
        if (sub === 'show') {
            const embedData = await getEmbed(interaction.guildId, name);
            if (!embedData) return interaction.reply({ content: '❌ Embed not found!', ephemeral: true });
            
            const embed = new EmbedBuilder()
                .setTitle(embedData.title || 'No title')
                .setDescription(embedData.description || 'No description')
                .setColor(embedData.color || config.embedColor);
            if (embedData.image) embed.setImage(embedData.image);
            if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);
            
            return interaction.reply({ embeds: [embed] });
        }
    }
};