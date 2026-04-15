const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const config = require('../../config');
const { getEmbed, getAllEmbeds, deleteEmbed, saveEmbed, getWelcomeSettings, setWelcomeSettings } = require('../utils/database');

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

async function handlePrefixCommand(client, message, commandName, args) {
    const PREFIX = config.prefix;
    const EMBED_COLOR = config.embedColor;

    // HELP COMMAND
    if (commandName === 'help') {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setAuthor({ 
                name: `${message.guild.name} Panel`, 
                iconURL: message.guild.iconURL({ size: 1024 }) 
            })
            .setTitle(`${client.user.username} Help Panel`)
            .setThumbnail(message.author.displayAvatarURL({ size: 1024 }))
            .setDescription(`
\`\`\`
╔══════════════════════════════════════╗
║         COMMAND INFORMATION          ║
╚══════════════════════════════════════╝
\`\`\`

**Prefix :** \`${PREFIX}\`
**Slash :** \`/\`
**Total Commands :** \`14\`
            `)
            .addFields(
                { 
                    name: `WELCOME MODULE`, 
                    value: `\`${PREFIX}welcome channel\`\n\`${PREFIX}welcome toggle\`\n\`${PREFIX}welcome message\`\n\`${PREFIX}welcome embed\`\n\`${PREFIX}test\``, 
                    inline: true 
                },
                { 
                    name: `EMBED MODULE`, 
                    value: `\`${PREFIX}embed create\`\n\`${PREFIX}embed edit\`\n\`${PREFIX}embed list\`\n\`${PREFIX}embed delete\`\n\`${PREFIX}embed show\``, 
                    inline: true 
                },
                { 
                    name: `OTHER MODULE`, 
                    value: `\`${PREFIX}ping\`\n\`${PREFIX}serverinfo\`\n\`${PREFIX}help\``, 
                    inline: true 
                }
            )
            .setFooter({ 
                text: 'Developed by LiveCord Development | Support | Invite', 
                iconURL: message.guild.iconURL({ size: 1024 }) 
            })
            .setTimestamp();
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`help_menu_${message.author.id}_${Date.now()}`)
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
        
        await message.reply({ embeds: [embed], components: [row] });
        
        return;
    }

    if (commandName === 'ping') {
        return message.reply(`Pong! ${client.ws.ping}ms`);
    }

    // PROFESSIONAL SERVERINFO COMMAND (No emojis, clean like your image)
    if (commandName === 'serverinfo') {
        const guild = message.guild;
        
        // Get member counts
        const totalMembers = guild.memberCount;
        const humans = guild.members.cache.filter(m => !m.user.bot).size;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        
        // Get channel counts
        const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
        const categories = guild.channels.cache.filter(c => c.type === 4).size;
        const totalChannels = textChannels + voiceChannels + categories;
        
        // Get role count
        const totalRoles = guild.roles.cache.size;
        
        // Get boost info
        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount || 0;
        
        // Get verification level
        const verificationLevels = {
            0: 'None',
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Highest'
        };
        
        // Get explicit content filter
        const explicitFilterLevels = {
            0: 'Disabled',
            1: 'Members without roles',
            2: 'All members'
        };
        
        // Get AFK channel and timeout
        const afkChannel = guild.afkChannel ? guild.afkChannel.name : 'None';
        const afkTimeout = guild.afkTimeout / 60;
        
        // Get system channel
        const systemChannel = guild.systemChannel ? guild.systemChannel.name : 'None';
        
        // Check features
        const isVerified = guild.features.includes('VERIFIED') ? 'Yes' : 'No';
        const isPartnered = guild.features.includes('PARTNERED') ? 'Yes' : 'No';
        const isCommunity = guild.features.includes('COMMUNITY') ? 'Yes' : 'No';
        const vanityURL = guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : 'None';
        
        // Get creation date
        const createdDate = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;
        
        // Get server icon URL
        const iconURL = guild.iconURL({ size: 1024 });
        
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle('Server Information')
            .setThumbnail(iconURL)
            .setDescription(`
**GENERAL INFORMATION**

**Name:** ${guild.name}
**ID:** ${guild.id}
**Owner:** <@${guild.ownerId}>
**Created At:** ${createdDate}
**Verified:** ${isVerified}
**Partnered:** ${isPartnered}

**SERVER STATISTICS**

**Total Roles:** ${totalRoles}
**Total Channels:** ${totalChannels}
**Text:** ${textChannels}
**Voice:** ${voiceChannels}
**Categories:** ${categories}
**Total Members:** ${totalMembers}
**Humans:** ${humans}
**Bots:** ${bots}

**EXTRA INFORMATION**

**2FA:** ${guild.mfaLevel === 0 ? 'Disabled' : 'Enabled'}
**Community Server:** ${isCommunity}
**Vanity URL:** ${vanityURL}
**Explicit Filter:** ${explicitFilterLevels[guild.explicitContentFilter] || 'Disabled'}
**Verification Level:** ${verificationLevels[guild.verificationLevel]}
**AFK Channel:** ${afkChannel}
**AFK Timeout:** ${afkTimeout} minutes
**System Channel:** ${systemChannel}
**Boost Level:** ${boostLevel}
**Boost Count:** ${boostCount}
            `)
            .setFooter({ 
                text: `Requested by ${message.author.username}`,
                iconURL: message.author.displayAvatarURL()
            })
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    }

    if (commandName === 'embed') {
        const subCmd = args[0];
        const name = args[1];

        if (subCmd === 'create') {
            if (!name) return message.reply(`Usage: ${PREFIX}embed create <name>`);
            const existing = await getEmbed(message.guild.id, name);
            if (existing) return message.reply('Embed already exists!');
            await saveEmbed(message.guild.id, name, {
                title: 'Welcome To The Server',
                description: 'Welcome {user} to {server}!\n\nStay with us\n\nThanks For Joining!!!',
                color: EMBED_COLOR,
                image: '{server_icon}',
                thumbnail: '{user_avatar}',
                authorName: '{server}',
                authorIcon: '{server_icon}',
                footerText: 'Thanks For Joining!',
                footerIcon: '{server_icon}',
                timestamp: true
            });
            return message.reply(`Embed **${name}** created!`);
        }

        if (subCmd === 'edit') {
            if (!name) return message.reply(`Usage: ${PREFIX}embed edit <name>`);
            const embedData = await getEmbed(message.guild.id, name);
            if (!embedData) return message.reply('Embed not found!');
            
            const previewEmbed = new EmbedBuilder()
                .setColor(embedData.color || EMBED_COLOR)
                .setTitle(replacePlaceholders(embedData.title || 'Welcome To The Server', message.author, message.guild))
                .setDescription(replacePlaceholders(embedData.description || 'Welcome {user} to {server}!', message.author, message.guild))
                .setFooter({ 
                    text: replacePlaceholders(embedData.footerText || 'Thanks For Joining!', message.author, message.guild),
                    iconURL: replacePlaceholders(embedData.footerIcon, message.author, message.guild)
                });
            
            if (embedData.authorName) {
                previewEmbed.setAuthor({ 
                    name: replacePlaceholders(embedData.authorName, message.author, message.guild),
                    iconURL: replacePlaceholders(embedData.authorIcon, message.author, message.guild)
                });
            }
            
            const imageUrl = replacePlaceholders(embedData.image, message.author, message.guild);
            if (imageUrl && imageUrl !== '{server_icon}' && imageUrl !== '{user_avatar}' && imageUrl.startsWith('http')) {
                previewEmbed.setImage(imageUrl);
            } else if (imageUrl === '{server_icon}' && message.guild.iconURL()) {
                previewEmbed.setImage(message.guild.iconURL({ size: 1024 }));
            } else if (imageUrl === '{user_avatar}') {
                previewEmbed.setImage(message.author.displayAvatarURL({ size: 1024 }));
            }
            
            const thumbnailUrl = replacePlaceholders(embedData.thumbnail, message.author, message.guild);
            if (thumbnailUrl && thumbnailUrl !== '{server_icon}' && thumbnailUrl !== '{user_avatar}' && thumbnailUrl.startsWith('http')) {
                previewEmbed.setThumbnail(thumbnailUrl);
            } else if (thumbnailUrl === '{server_icon}' && message.guild.iconURL()) {
                previewEmbed.setThumbnail(message.guild.iconURL({ size: 1024 }));
            } else if (thumbnailUrl === '{user_avatar}') {
                previewEmbed.setThumbnail(message.author.displayAvatarURL({ size: 1024 }));
            }
            
            if (embedData.timestamp) {
                previewEmbed.setTimestamp();
            }
            
            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`edit_basic_${name}`)
                        .setLabel('Edit Basic')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`edit_author_${name}`)
                        .setLabel('Edit Author')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`edit_footer_${name}`)
                        .setLabel('Edit Footer')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`edit_images_${name}`)
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
            
            await message.reply({ 
                content: `${message.author.username} used embed edit ${name}`,
                embeds: [previewEmbed], 
                components: [row1, row2, row3] 
            });
            return;
        }

        if (subCmd === 'list') {
            const embedsList = await getAllEmbeds(message.guild.id);
            const names = Object.keys(embedsList);
            if (names.length === 0) return message.reply('No embeds found.');
            const embed = new EmbedBuilder()
                .setColor(EMBED_COLOR)
                .setTitle('Saved Embeds')
                .setDescription(names.map(n => `• ${n}`).join('\n'));
            return message.reply({ embeds: [embed] });
        }

        if (subCmd === 'delete') {
            if (!name) return message.reply(`Usage: ${PREFIX}embed delete <name>`);
            const deleted = await deleteEmbed(message.guild.id, name);
            if (deleted) {
                return message.reply(`Embed **${name}** deleted!`);
            }
            return message.reply('Embed not found!');
        }

        if (subCmd === 'show') {
            if (!name) return message.reply(`Usage: ${PREFIX}embed show <name>`);
            const embedData = await getEmbed(message.guild.id, name);
            if (!embedData) return message.reply('Embed not found!');
            const embed = new EmbedBuilder()
                .setTitle(replacePlaceholders(embedData.title || 'No title', message.author, message.guild))
                .setDescription(replacePlaceholders(embedData.description || 'No description', message.author, message.guild))
                .setColor(embedData.color || EMBED_COLOR);
            if (embedData.image) embed.setImage(replacePlaceholders(embedData.image, message.author, message.guild));
            if (embedData.thumbnail) embed.setThumbnail(replacePlaceholders(embedData.thumbnail, message.author, message.guild));
            return message.reply({ embeds: [embed] });
        }
    }

    if (commandName === 'welcome') {
        const subCmd = args[0];

        if (subCmd === 'channel') {
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply('Please mention a channel!');
            await setWelcomeSettings(message.guild.id, { channelId: channel.id });
            return message.reply(`Welcome channel set to ${channel}`);
        }

        if (subCmd === 'toggle') {
            const enabled = args[1] === 'true';
            await setWelcomeSettings(message.guild.id, { enabled });
            return message.reply(`Welcome messages ${enabled ? 'enabled' : 'disabled'}`);
        }

        if (subCmd === 'message') {
            const msg = args.slice(1).join(' ');
            if (!msg) return message.reply('Please provide a message! Use {user}, {server}, {embed:name}');
            
            const embedMatch = msg.match(/\{embed:([^}]+)\}/);
            let embedName = null;
            let cleanMessage = msg;
            
            if (embedMatch) {
                embedName = embedMatch[1];
                cleanMessage = msg.replace(/\{embed:[^}]+\}/, '').trim();
                
                const embedData = await getEmbed(message.guild.id, embedName);
                if (!embedData) {
                    return message.reply(`Embed **${embedName}** not found! Create it first with \`${PREFIX}embed create ${embedName}\``);
                }
            }
            
            await setWelcomeSettings(message.guild.id, { 
                message: cleanMessage, 
                embedName: embedName
            });
            
            let preview = cleanMessage.replace(/{user}/g, `<@${message.author.id}>`).replace(/{server}/g, message.guild.name);
            if (embedName) {
                preview += `\n\n[Embed: ${embedName} will appear below]`;
            }
            
            return message.reply(`Welcome message set!\n\nPreview:\n${preview}`);
        }

        if (subCmd === 'embed') {
            const embedName = args[1];
            if (!embedName) return message.reply(`Usage: ${PREFIX}welcome embed <embed_name>`);
            const embedData = await getEmbed(message.guild.id, embedName);
            if (!embedData) return message.reply('Embed not found!');
            await setWelcomeSettings(message.guild.id, { embedName, message: null });
            return message.reply(`Welcome embed set to **${embedName}**`);
        }
    }

    if (commandName === 'test') {
        const settings = await getWelcomeSettings(message.guild.id);
        
        if (!settings.channelId) {
            return message.reply('❌ Please set a welcome channel first using `&welcome channel #channel`');
        }
        
        if (!settings.enabled) {
            return message.reply('❌ Welcome is disabled. Enable with `&welcome toggle true`');
        }
        
        const channel = message.guild.channels.cache.get(settings.channelId);
        if (!channel) {
            return message.reply('❌ Welcome channel not found! It may have been deleted.');
        }
        
        const botMember = message.guild.members.me;
        const perms = channel.permissionsFor(botMember);
        
        if (!perms.has('SendMessages')) {
            return message.reply(`❌ I don't have permission to send messages in ${channel}. Please check my permissions.`);
        }
        
        if (!perms.has('EmbedLinks') && settings.embedName) {
            return message.reply(`❌ I don't have permission to send embeds in ${channel}. Please enable "Embed Links" permission.`);
        }
        
        const infoEmbed = new EmbedBuilder()
            .setColor(EMBED_COLOR)
            .setTitle('🧪 Welcome Test')
            .setDescription('Here is how your welcome message will look:')
            .addFields(
                { name: '📢 Channel', value: `${channel}`, inline: true },
                { name: '✅ Status', value: settings.enabled ? 'Enabled' : 'Disabled', inline: true },
                { name: '📝 Type', value: settings.embedName ? `Embed: ${settings.embedName}` : 'Text Message', inline: true }
            )
            .setFooter({ text: 'Test sent below ↓' });
        
        await message.reply({ embeds: [infoEmbed] });
        
        const hasText = settings.message && settings.message.trim();
        const hasEmbed = settings.embedName;
        
        if (hasText && hasEmbed) {
            const embedData = await getEmbed(message.guild.id, settings.embedName);
            if (embedData) {
                const embed = new EmbedBuilder()
                    .setTitle(replacePlaceholders(embedData.title, message.author, message.guild))
                    .setDescription(replacePlaceholders(embedData.description, message.author, message.guild))
                    .setColor(embedData.color || EMBED_COLOR);
                
                if (embedData.image) embed.setImage(replacePlaceholders(embedData.image, message.author, message.guild));
                if (embedData.thumbnail) embed.setThumbnail(replacePlaceholders(embedData.thumbnail, message.author, message.guild));
                if (embedData.authorName) {
                    embed.setAuthor({
                        name: replacePlaceholders(embedData.authorName, message.author, message.guild),
                        iconURL: replacePlaceholders(embedData.authorIcon, message.author, message.guild)
                    });
                }
                if (embedData.footerText) {
                    embed.setFooter({
                        text: replacePlaceholders(embedData.footerText, message.author, message.guild),
                        iconURL: replacePlaceholders(embedData.footerIcon, message.author, message.guild)
                    });
                }
                if (embedData.timestamp) embed.setTimestamp();
                
                const textMsg = settings.message
                    .replace(/{user}/g, `<@${message.author.id}>`)
                    .replace(/{username}/g, message.author.username)
                    .replace(/{server}/g, message.guild.name)
                    .replace(/{server_icon}/g, message.guild.iconURL({ size: 1024 }) || '')
                    .replace(/{member_count}/g, message.guild.memberCount)
                    .replace(/{user_avatar}/g, message.author.displayAvatarURL({ size: 1024 }));
                
                await channel.send({ content: textMsg, embeds: [embed] });
                return message.reply(`✅ Test sent to ${channel}! Check the message above.`);
            }
        } else if (hasEmbed) {
            const embedData = await getEmbed(message.guild.id, settings.embedName);
            if (embedData) {
                const embed = new EmbedBuilder()
                    .setTitle(replacePlaceholders(embedData.title, message.author, message.guild))
                    .setDescription(replacePlaceholders(embedData.description, message.author, message.guild))
                    .setColor(embedData.color || EMBED_COLOR);
                
                if (embedData.image) embed.setImage(replacePlaceholders(embedData.image, message.author, message.guild));
                if (embedData.thumbnail) embed.setThumbnail(replacePlaceholders(embedData.thumbnail, message.author, message.guild));
                if (embedData.authorName) {
                    embed.setAuthor({
                        name: replacePlaceholders(embedData.authorName, message.author, message.guild),
                        iconURL: replacePlaceholders(embedData.authorIcon, message.author, message.guild)
                    });
                }
                if (embedData.footerText) {
                    embed.setFooter({
                        text: replacePlaceholders(embedData.footerText, message.author, message.guild),
                        iconURL: replacePlaceholders(embedData.footerIcon, message.author, message.guild)
                    });
                }
                if (embedData.timestamp) embed.setTimestamp();
                
                await channel.send({ embeds: [embed] });
                return message.reply(`✅ Test sent to ${channel}! Check the message above.`);
            }
        } else if (hasText) {
            const textMsg = settings.message
                .replace(/{user}/g, `<@${message.author.id}>`)
                .replace(/{username}/g, message.author.username)
                .replace(/{server}/g, message.guild.name)
                .replace(/{server_icon}/g, message.guild.iconURL({ size: 1024 }) || '')
                .replace(/{member_count}/g, message.guild.memberCount)
                .replace(/{user_avatar}/g, message.author.displayAvatarURL({ size: 1024 }));
            
            await channel.send(textMsg);
            return message.reply(`✅ Test sent to ${channel}! Check the message above.`);
        }
        
        return message.reply('❌ No welcome message or embed set! Use `&welcome message <text>` or `&welcome embed <name>`');
    }
}

module.exports = { handlePrefixCommand };