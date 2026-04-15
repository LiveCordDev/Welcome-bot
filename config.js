require('dotenv').config();

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    prefix: process.env.PREFIX || '&',
    embedColor: '#FF69B4',
    version: '1.0.0',
    mongodbUri: process.env.MONGODB_URI
};