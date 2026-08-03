const NodeCache = require("node-cache");

const artworkCache = new NodeCache({ stdTTL: 300 });
// maxKeys caps memory growth since the cache key is derived from user-supplied city input
const weatherCache = new NodeCache({ stdTTL: 300, maxKeys: 500 });

module.exports = { artworkCache, weatherCache };
