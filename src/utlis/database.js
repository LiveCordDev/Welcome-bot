const { Embed, Welcome } = require('./mongo');

async function saveEmbed(guildId, name, data) {
    const existing = await Embed.findOne({ guildId, name });
    if (existing) {
        await Embed.updateOne({ guildId, name }, data);
    } else {
        await Embed.create({ guildId, name, ...data });
    }
}

async function getEmbed(guildId, name) {
    return await Embed.findOne({ guildId, name });
}

async function getAllEmbeds(guildId) {
    const embeds = await Embed.find({ guildId });
    const result = {};
    embeds.forEach(e => {
        result[e.name] = {
            title: e.title,
            description: e.description,
            color: e.color,
            image: e.image,
            thumbnail: e.thumbnail,
            authorName: e.authorName,
            authorIcon: e.authorIcon,
            footerText: e.footerText,
            footerIcon: e.footerIcon
        };
    });
    return result;
}

async function deleteEmbed(guildId, name) {
    const result = await Embed.deleteOne({ guildId, name });
    return result.deletedCount > 0;
}

async function setWelcomeSettings(guildId, settings) {
    const existing = await Welcome.findOne({ guildId });
    if (existing) {
        await Welcome.updateOne({ guildId }, settings);
    } else {
        await Welcome.create({ guildId, ...settings });
    }
}

async function getWelcomeSettings(guildId) {
    const settings = await Welcome.findOne({ guildId });
    if (!settings) {
        return { enabled: false, channelId: null, message: null, embedName: null };
    }
    return {
        enabled: settings.enabled,
        channelId: settings.channelId,
        message: settings.message,
        embedName: settings.embedName
    };
}

module.exports = {
    saveEmbed,
    getEmbed,
    getAllEmbeds,
    deleteEmbed,
    setWelcomeSettings,
    getWelcomeSettings
};