const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { getWelcomeSettings, getEmbed } = require('../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Test welcome message'),
    
    async execute(interaction) {
        const settings = await getWelcomeSettings(interaction.guildId);
        if (!settings.enabled) return interaction.reply({ content: '⚠️ Welcome disabled. Use `/welcome toggle true`', ephemeral: true });
        
        const channel = settings.channelId ? interaction.guild.channels.cache.get(settings.channelId) : interaction.channel;
        if (!channel) return interaction.reply({ content: '❌ Welcome channel not found!', ephemeral: true });
        
        if (settings.embedName) {
            const embedData = await getEmbed(interaction.guildId, settings.embedName);
            if (embedData) {
                const embed = new EmbedBuilder()
                    .setTitle(embedData.title?.replace('{user}', interaction.user.username).replace('{server}', interaction.guild.name))
                    .setDescription(embedData.description?.replace('{user}', `<@${interaction.user.id}>`).replace('{server}', interaction.guild.name))
                    .setColor(embedData.color || config.embedColor);
                await channel.send({ embeds: [embed] });
                return interaction.reply({ content: '✅ Test welcome sent!', ephemeral: true });
            }
        }
        
        if (settings.message) {
            const msg = settings.message.replace('{user}', `<@${interaction.user.id}>`).replace('{server}', interaction.guild.name);
            await channel.send(msg);
            return interaction.reply({ content: '✅ Test welcome sent!', ephemeral: true });
        }
        
        return interaction.reply({ content: '⚠️ No welcome message or embed set!', ephemeral: true });
    }
};