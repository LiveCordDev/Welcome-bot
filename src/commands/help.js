const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all commands'),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('📋 LiveCord Welcome Bot Commands')
            .setDescription('**Prefix: `&`**\n**Slash: `/`**')
            .addFields(
                { name: '🎨 Embed Commands', value: '`/embed create`\n`/embed edit`\n`/embed edit_all`\n`/embed list`\n`/embed delete`\n`/embed show`', inline: false },
                { name: '👋 Welcome Commands', value: '`/welcome channel`\n`/welcome toggle`\n`/welcome message`\n`/welcome embed`\n`/test`', inline: false },
                { name: '⚙️ Other Commands', value: '`/ping`\n`/serverinfo`\n`/help`', inline: false }
            )
            .setFooter({ text: 'Made by LiveCord Development' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};