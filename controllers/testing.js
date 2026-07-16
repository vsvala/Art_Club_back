const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Artwork = require("../models/artwork");
const { artworkCache, weatherCache } = require("../utils/caches");

router.post("/reset", async (req, res, next) => {
  try {
    await Artwork.deleteMany({});
    await User.deleteMany({});
    artworkCache.flushAll();
    weatherCache.flushAll();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.post("/users", async (req, res) => {
  try {
    const { name, email, username, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, username, passwordHash, role });
    const savedUser = await user.save();
    res.status(201).json(savedUser.toJSON());
  } catch (error) {
    next(error);
  }
});

router.post("/artworks", async (req, res, next) => {
  try {
    const { galleryImage, artist, name, year, size, medium, likes, user } = req.body;
    const artwork = new Artwork({
      galleryImage,
      artist,
      name,
      year,
      size,
      medium,
      likes: likes ? likes : 0,
      user,
    });
    const savedArtwork = await artwork.save();
    res.status(201).json(savedArtwork.toJSON());
  } catch (error) {
    next(error);
  }
});

module.exports = router;
