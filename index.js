const { Client, GatewayIntentBits, Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { connectMongo } = require('./src/utils/mongo');
const { handlePrefixCommand } = require('./src/handlers/commandHandler');
const { getWelcomeSettings, getEmbed, saveEmbed } = require('./src/utils/database');

connectMongo();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

function replacePlaceholders(text, user, guild) {
    if (!text) return text;
    
    let serverIcon = guild.iconURL({ size: 1024 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    let result = text
        .replace(/{user}/g, `<@${user.id}>`)
        .replace(/{username}/g, user.username)
        .replace(/{server}/g, guild.name)
        .replace(/{member_count}/g, guild.memberCount)
        .replace(/{user_avatar}/g, user.displayAvatarURL({ size: 1024 }))
        .replace(/{server_icon}/g, serverIcon);
    
    return result;
}

async function updateEditMessage(interaction, embedName) {
    const embedData = await getEmbed(interaction.guildId, embedName);
    if (!embedData) return;
    
    const previewEmbed = new EmbedBuilder()
        .setColor(embedData.color || config.embedColor)
        .setTitle(replacePlaceholders(embedData.title || 'Welcome To The Server', interaction.user, interaction.guild))
        .setDescription(replacePlaceholders(embedData.description || 'Welcome {user} to {server}!', interaction.user, interaction.guild))
        .setFooter({ 
            text: replacePlaceholders(embedData.footerText || 'Thanks For Joining!', interaction.user, interaction.guild),
            iconURL: replacePlaceholders(embedData.footerIcon, interaction.user, interaction.guild)
        });
    
    if (embedData.authorName) {
        previewEmbed.setAuthor({ 
            name: replacePlaceholders(embedData.authorName, interaction.user, interaction.guild),
            iconURL: replacePlaceholders(embedData.authorIcon, interaction.user, interaction.guild)
        });
    }
    
    const imageUrl = replacePlaceholders(embedData.image, interaction.user, interaction.guild);
    if (imageUrl && imageUrl !== '{server_icon}' && imageUrl !== '{user_avatar}' && imageUrl.startsWith('http')) {
        previewEmbed.setImage(imageUrl);
    } else if (imageUrl === '{server_icon}' && interaction.guild.iconURL()) {
        previewEmbed.setImage(interaction.guild.iconURL({ size: 1024 }));
    } else if (imageUrl === '{user_avatar}') {
        previewEmbed.setImage(interaction.user.displayAvatarURL({ size: 1024 }));
    }
    
    const thumbnailUrl = replacePlaceholders(embedData.thumbnail, interaction.user, interaction.guild);
    if (thumbnailUrl && thumbnailUrl !== '{server_icon}' && thumbnailUrl !== '{user_avatar}' && thumbnailUrl.startsWith('http')) {
        previewEmbed.setThumbnail(thumbnailUrl);
    } else if (thumbnailUrl === '{server_icon}' && interaction.guild.iconURL()) {
        previewEmbed.setThumbnail(interaction.guild.iconURL({ size: 1024 }));
    } else if (thumbnailUrl === '{user_avatar}') {
        previewEmbed.setThumbnail(interaction.user.displayAvatarURL({ size: 1024 }));
    }
    
    if (embedData.timestamp) {
        previewEmbed.setTimestamp();
    }
    
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`edit_basic_${embedName}`)
                .setLabel('Edit Basic')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`edit_author_${embedName}`)
                .setLabel('Edit Author')
                .setStyle(ButtonStyle.Secondary)
        );
    
    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`edit_footer_${embedName}`)
                .setLabel('Edit Footer')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`edit_images_${embedName}`)
                .setLabel('Edit Images')
                .setStyle(ButtonStyle.Secondary)
        );
    
    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Support Server')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/livecord')
        );
    
    await interaction.update({ 
        content: `${interaction.user.username} used embed edit ${embedName}`,
        embeds: [previewEmbed], 
        components: [row1, row2, row3] 
    });
}

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;
    
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    await handlePrefixCommand(client, message, commandName, args);
});

client.on(Events.InteractionCreate, async (interaction) => {
    // Handle Select Menu for Help
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId.startsWith('help_menu_')) {
            const userId = interaction.customId.split('_')[2];
            
            if (interaction.user.id !== userId) {
                return interaction.reply({ 
                    content: 'This help menu is not for you! Use `&help` to open your own.', 
                    ephemeral: true 
                });
            }
            
            const selected = interaction.values[0];
            const PREFIX = config.prefix;
            
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setAuthor({ 
                    name: `${interaction.guild.name} Panel`, 
                    iconURL: interaction.guild.iconURL({ size: 1024 }) 
                })
                .setTitle(`${interaction.client.user.username} Help Panel`)
                .setThumbnail(interaction.user.displayAvatarURL({ size: 1024 }))
                .setFooter({ 
                    text: 'Developed by LiveCord Development | Support | Invite', 
                    iconURL: interaction.guild.iconURL({ size: 1024 }) 
                })
                .setTimestamp();
            
            if (selected === 'welcome') {
                embed.setDescription(`
\`\`\`
╔══════════════════════════════════════╗
║         WELCOME MODULE               ║
╚══════════════════════════════════════╝
\`\`\`

**Commands:**

\`${PREFIX}welcome channel #channel\` - Set welcome channel
\`${PREFIX}welcome toggle true/false\` - Enable/disable welcome
\`${PREFIX}welcome message <text>\` - Set welcome message
\`${PREFIX}welcome embed <name>\` - Use embed for welcome
\`${PREFIX}test\` - Test welcome message

**Placeholders:**
• {user} - Mention user
• {username} - Username only
• {server} - Server name
• {server_icon} - Server icon
• {user_avatar} - User avatar
• {member_count} - Member count
                `);
            } else if (selected === 'embed') {
                embed.setDescription(`
\`\`\`
╔══════════════════════════════════════╗
║         EMBED MODULE                 ║
╚══════════════════════════════════════╝
\`\`\`

**Commands:**

\`${PREFIX}embed create <name>\` - Create new embed
\`${PREFIX}embed edit <name>\` - Edit embed
\`${PREFIX}embed list\` - List all embeds
\`${PREFIX}embed delete <name>\` - Delete embed
\`${PREFIX}embed show <name>\` - Show embed
                `);
            } else if (selected === 'other') {
                embed.setDescription(`
\`\`\`
╔══════════════════════════════════════╗
║         OTHER MODULE                 ║
╚══════════════════════════════════════╝
\`\`\`

**Commands:**

\`${PREFIX}ping\` - Check bot latency
\`${PREFIX}serverinfo\` - Show server info
\`${PREFIX}help\` - Show this menu
                `);
            } else if (selected === 'support') {
                embed.setDescription(`
\`\`\`
╔══════════════════════════════════════╗
║         SUPPORT SERVER               ║
╚══════════════════════════════════════╝
\`\`\`

Join our support server for help and updates!

**https://discord.gg/livecord**
                `);
            }
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`help_menu_${interaction.user.id}_${Date.now()}`)
                .setPlaceholder('Select a module to view commands')
                .addOptions([
                    {
                        label: 'Welcome Module',
                        description: 'View all welcome commands',
                        value: 'welcome'
                    },
                    {
                        label: 'Embed Module',
                        description: 'View all embed commands',
                        value: 'embed'
                    },
                    {
                        label: 'Other Module',
                        description: 'View other utility commands',
                        value: 'other'
                    },
                    {
                        label: 'Support Server',
                        description: 'Join our support server',
                        value: 'support'
                    }
                ]);
            
            const row = new ActionRowBuilder().addComponents(selectMenu);
            
            await interaction.update({ embeds: [embed], components: [row] });
        }
    }
    
    // Handle Buttons
    if (interaction.isButton()) {
        const customId = interaction.customId;
        
        if (customId.startsWith('edit_basic_')) {
            const embedName = customId.replace('edit_basic_', '');
            const embedData = await getEmbed(interaction.guildId, embedName);
            
            const modal = new ModalBuilder()
                .setCustomId(`modal_basic_${embedName}`)
                .setTitle(`Edit Basic: ${embedName}`);
            
            const titleInput = new TextInputBuilder()
                .setCustomId('title')
                .setLabel('Title')
                .setStyle(TextInputStyle.Short)
                .setValue(embedData?.title || '')
                .setRequired(false);
            
            const descInput = new TextInputBuilder()
                .setCustomId('description')
                .setLabel('Description')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(embedData?.description || '')
                .setRequired(false);
            
            const colorInput = new TextInputBuilder()
                .setCustomId('color')
                .setLabel('Color Hex')
                .setStyle(TextInputStyle.Short)
                .setValue(embedData?.color || '#FF69B4')
                .setRequired(false);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descInput),
                new ActionRowBuilder().addComponents(colorInput)
            );
            
            await interaction.showModal(modal);
        }
        
        if (customId.startsWith('edit_author_')) {
            const embedName = customId.replace('edit_author_', '');
            const embedData = await getEmbed(interaction.guildId, embedName);
            
            const modal = new ModalBuilder()
                .setCustomId(`modal_author_${embedName}`)
                .setTitle(`Edit Author: ${embedName}`);
            
            const authorInput = new TextInputBuilder()
                .setCustomId('author')
                .setLabel('Author Name')
                .setStyle(TextInputStyle.Short)
                .setValue(embedData?.authorName || '')
                .setRequired(false);
            
            const authorIconInput = new TextInputBuilder()
                .setCustomId('author_icon')
                .setLabel('Author Icon URL')
                .setStyle(TextInputStyle.Short)
                .setValue(embedData?.authorIcon || '')
                .setRequired(false);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(authorInput),
                new ActionRowBuilder().addComponents(authorIconInput)
            );
            await interaction.showModal(modal);
        }
        
        if (customId.startsWith('edit_footer_')) {
            const embedName = customId.replace('edit_footer_', '');
            const embedData = await getEmbed(interaction.guildId, embedName);
            
            const modal = new ModalBuilder()
                .setCustomId(`modal_footer_${embedName}`)
                .setTitle(`Edit Footer: ${embedName}`);
            
            const footerInput = new TextInputBuilder()
                .setCustomId('footer')
                .setLabel('Footer Text')
                .setStyle(TextInputStyle.Short)
                .setValue(embedData?.footerText || '')
                .setRequired(false);
            
            const footerIconInput = new TextInputBuilder()
                .setCustomId('footer_icon')
                .setLabel('Footer Icon URL')
                .setStyle(TextInputStyle.Short)
                .setValue(embedData?.footerIcon || '')
                .setRequired(false);
            
            const timestampInput = new TextInputBuilder()
                .setCustomId('timestamp')
                .setLabel('Timestamp (yes/no)')
                .setStyle(TextInputStyle.Short)
                .setValue(embedData?.timestamp ? 'yes' : 'no')
                .setRequired(false);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(footerInput),
                new ActionRowBuilder().addComponents(footerIconInput),
                new ActionRowBuilder().addComponents(timestampInput)
            );
            await interaction.showModal(modal);
        }
        
        if (customId.startsWith('edit_images_')) {
            const embedName = customId.replace('edit_images_', '');
            const embedData = await getEmbed(interaction.guildId, embedName);
            
            const modal = new ModalBuilder()
                .setCustomId(`modal_images_${embedName}`)
                .setTitle(`Edit Images: ${embedName}`);
            
            const imageInput = new TextInputBuilder()
                .setCustomId('image')
                .setLabel('Image URL')
                .setStyle(TextInputStyle.Short)
                .setValue(embedData?.image || '')
                .setRequired(false);
            
            const thumbInput = new TextInputBuilder()
                .setCustomId('thumbnail')
                .setLabel('Thumbnail URL')
                .setStyle(TextInputStyle.Short)
                .setValue(embedData?.thumbnail || '')
                .setRequired(false);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(imageInput),
                new ActionRowBuilder().addComponents(thumbInput)
            );
            await interaction.showModal(modal);
        }
    }
    
    // Handle Modal Submits
    if (interaction.isModalSubmit()) {
        const customId = interaction.customId;
        
        if (customId.startsWith('modal_basic_')) {
            const embedName = customId.replace('modal_basic_', '');
            const title = interaction.fields.getTextInputValue('title');
            const description = interaction.fields.getTextInputValue('description');
            const color = interaction.fields.getTextInputValue('color');
            
            const embedData = await getEmbed(interaction.guildId, embedName);
            if (embedData) {
                embedData.title = title;
                embedData.description = description;
                embedData.color = color;
                await saveEmbed(interaction.guildId, embedName, embedData);
                await updateEditMessage(interaction, embedName);
            }
        }
        
        if (customId.startsWith('modal_author_')) {
            const embedName = customId.replace('modal_author_', '');
            const author = interaction.fields.getTextInputValue('author');
            const authorIcon = interaction.fields.getTextInputValue('author_icon');
            
            const embedData = await getEmbed(interaction.guildId, embedName);
            if (embedData) {
                embedData.authorName = author;
                embedData.authorIcon = authorIcon;
                await saveEmbed(interaction.guildId, embedName, embedData);
                await updateEditMessage(interaction, embedName);
            }
        }
        
        if (customId.startsWith('modal_footer_')) {
            const embedName = customId.replace('modal_footer_', '');
            const footer = interaction.fields.getTextInputValue('footer');
            const footerIcon = interaction.fields.getTextInputValue('footer_icon');
            const timestamp = interaction.fields.getTextInputValue('timestamp');
            
            const embedData = await getEmbed(interaction.guildId, embedName);
            if (embedData) {
                embedData.footerText = footer;
                embedData.footerIcon = footerIcon;
                embedData.timestamp = timestamp === 'yes';
                await saveEmbed(interaction.guildId, embedName, embedData);
                await updateEditMessage(interaction, embedName);
            }
        }
        
        if (customId.startsWith('modal_images_')) {
            const embedName = customId.replace('modal_images_', '');
            const image = interaction.fields.getTextInputValue('image');
            const thumbnail = interaction.fields.getTextInputValue('thumbnail');
            
            const embedData = await getEmbed(interaction.guildId, embedName);
            if (embedData) {
                embedData.image = image;
                embedData.thumbnail = thumbnail;
                await saveEmbed(interaction.guildId, embedName, embedData);
                await updateEditMessage(interaction, embedName);
            }
        }
    }
    
    // Handle Slash Commands
    if (interaction.isChatInputCommand()) {
        const commandFiles = fs.readdirSync(path.join(__dirname, 'src', 'commands')).filter(f => f.endsWith('.js'));
        
        for (const file of commandFiles) {
            const command = require(`./src/commands/${file}`);
            if (command.data && command.data.name === interaction.commandName) {
                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: 'There was an error!', ephemeral: true });
                }
                break;
            }
        }
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    const settings = await getWelcomeSettings(member.guild.id);
    if (!settings.enabled) return;
    if (!settings.channelId) return;
    
    const channel = member.guild.channels.cache.get(settings.channelId);
    if (!channel) return;
    
    function replace(text) {
        if (!text) return text;
        
        let serverIcon = member.guild.iconURL({ size: 1024 }) || 'https://cdn.discordapp.com/embed/avatars/0.png';
        
        let result = text
            .replace(/{user}/g, `<@${member.id}>`)
            .replace(/{username}/g, member.user.username)
            .replace(/{server}/g, member.guild.name)
            .replace(/{member_count}/g, member.guild.memberCount)
            .replace(/{user_avatar}/g, member.user.displayAvatarURL({ size: 1024 }))
            .replace(/{server_icon}/g, serverIcon);
        
        return result;
    }
    
    // Send both text and embed in ONE message using reply with content + embed
    const hasText = settings.message && settings.message.trim();
    const hasEmbed = settings.embedName;
    
    if (hasText && hasEmbed) {
        const embedData = await getEmbed(member.guild.id, settings.embedName);
        if (embedData) {
            const embed = new EmbedBuilder()
                .setTitle(replace(embedData.title) || 'Welcome!')
                .setDescription(replace(embedData.description) || `Welcome ${member.user.username}!`)
                .setColor(embedData.color || config.embedColor);
            
            const imageUrl = replace(embedData.image);
            if (imageUrl && imageUrl !== '{server_icon}' && imageUrl !== '{user_avatar}' && imageUrl.startsWith('http')) {
                embed.setImage(imageUrl);
            } else if (imageUrl === '{server_icon}' && member.guild.iconURL()) {
                embed.setImage(member.guild.iconURL({ size: 1024 }));
            } else if (imageUrl === '{user_avatar}') {
                embed.setImage(member.user.displayAvatarURL({ size: 1024 }));
            }
            
            const thumbnailUrl = replace(embedData.thumbnail);
            if (thumbnailUrl && thumbnailUrl !== '{server_icon}' && thumbnailUrl !== '{user_avatar}' && thumbnailUrl.startsWith('http')) {
                embed.setThumbnail(thumbnailUrl);
            } else if (thumbnailUrl === '{server_icon}' && member.guild.iconURL()) {
                embed.setThumbnail(member.guild.iconURL({ size: 1024 }));
            } else if (thumbnailUrl === '{user_avatar}') {
                embed.setThumbnail(member.user.displayAvatarURL({ size: 1024 }));
            }
            
            if (embedData.authorName) {
                embed.setAuthor({
                    name: replace(embedData.authorName),
                    iconURL: replace(embedData.authorIcon)
                });
            }
            
            if (embedData.footerText) {
                embed.setFooter({
                    text: replace(embedData.footerText),
                    iconURL: replace(embedData.footerIcon)
                });
            }
            
            if (embedData.timestamp) {
                embed.setTimestamp();
            }
            
            const textMsg = replace(settings.message);
            await channel.send({ content: textMsg, embeds: [embed] });
        }
    } else if (hasEmbed) {
        const embedData = await getEmbed(member.guild.id, settings.embedName);
        if (embedData) {
            const embed = new EmbedBuilder()
                .setTitle(replace(embedData.title) || 'Welcome!')
                .setDescription(replace(embedData.description) || `Welcome ${member.user.username}!`)
                .setColor(embedData.color || config.embedColor);
            
            const imageUrl = replace(embedData.image);
            if (imageUrl && imageUrl !== '{server_icon}' && imageUrl !== '{user_avatar}' && imageUrl.startsWith('http')) {
                embed.setImage(imageUrl);
            } else if (imageUrl === '{server_icon}' && member.guild.iconURL()) {
                embed.setImage(member.guild.iconURL({ size: 1024 }));
            } else if (imageUrl === '{user_avatar}') {
                embed.setImage(member.user.displayAvatarURL({ size: 1024 }));
            }
            
            const thumbnailUrl = replace(embedData.thumbnail);
            if (thumbnailUrl && thumbnailUrl !== '{server_icon}' && thumbnailUrl !== '{user_avatar}' && thumbnailUrl.startsWith('http')) {
                embed.setThumbnail(thumbnailUrl);
            } else if (thumbnailUrl === '{server_icon}' && member.guild.iconURL()) {
                embed.setThumbnail(member.guild.iconURL({ size: 1024 }));
            } else if (thumbnailUrl === '{user_avatar}') {
                embed.setThumbnail(member.user.displayAvatarURL({ size: 1024 }));
            }
            
            if (embedData.authorName) {
                embed.setAuthor({
                    name: replace(embedData.authorName),
                    iconURL: replace(embedData.authorIcon)
                });
            }
            
            if (embedData.footerText) {
                embed.setFooter({
                    text: replace(embedData.footerText),
                    iconURL: replace(embedData.footerIcon)
                });
            }
            
            if (embedData.timestamp) {
                embed.setTimestamp();
            }
            
            await channel.send({ embeds: [embed] });
        }
    } else if (hasText) {
        const textMsg = replace(settings.message);
        await channel.send(textMsg);
    }
});

client.once(Events.ClientReady, () => {
    console.log(`✅ ${client.user.tag} is online!`);
    console.log(`📡 Prefix: ${config.prefix}`);
    console.log(`🔧 Slash commands: /help`);
    console.log(`📊 Serving ${client.guilds.cache.size} servers`);
    
    client.user.setPresence({
        activities: [{
            name: `${config.prefix}help | ${client.guilds.cache.size} servers`,
            type: ActivityType.Watching
        }],
        status: 'online'
    });
    
    setInterval(() => {
        client.user.setPresence({
            activities: [{
                name: `${config.prefix}help | ${client.guilds.cache.size} servers`,
                type: ActivityType.Watching
            }],
            status: 'online'
        });
    }, 30000);
});

client.login(config.token);