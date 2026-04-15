const mongoose = require('mongoose');
const config = require('../../config');

async function connectMongo() {
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB error:', error);
    }
}

const embedSchema = new mongoose.Schema({
    guildId: String,
    name: String,
    title: String,
    description: String,
    color: String,
    image: String,
    thumbnail: String,
    authorName: String,
    authorIcon: String,
    footerText: String,
    footerIcon: String
});

const welcomeSchema = new mongoose.Schema({
    guildId: { type: String, unique: true },
    enabled: { type: Boolean, default: false },
    channelId: String,
    message: String,
    embedName: String
});

const Embed = mongoose.model('Embed', embedSchema);
const Welcome = mongoose.model('Welcome', welcomeSchema);

module.exports = {
    connectMongo,
    Embed,
    Welcome
};