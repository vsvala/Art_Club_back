const NodeCache = require("node-cache");

const artworkCache = new NodeCache({ stdTTL: 300 });
const weatherCache = new NodeCache({ stdTTL: 300 });

module.exports = { artworkCache, weatherCache };
