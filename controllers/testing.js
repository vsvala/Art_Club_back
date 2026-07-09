const router = require("express").Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const Artwork = require("../models/artwork");

router.post("/reset", async (req, res) => {
  await Artwork.deleteMany({});
  await User.deleteMany({});
  res.status(204).end();
});

router.post("/users", async (req, res) => {
  const { name, email, username, password, role } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, username, passwordHash, role });
  const savedUser = await user.save();
  res.status(201).json(savedUser.toJSON());
});

router.post("/artworks", async (req, res) => {
  const { galleryImage, artist, name, year, size, medium, likes, user } =
    req.body;
  const artwork = new Artwork({
    galleryImage,
    artist,
    name,
    year,
    size,
    medium,
    likes: likes ?? 0,
    user,
  });
  const savedArtwork = await artwork.save();
  res.status(201).json(savedArtwork.toJSON());
});

module.exports = router;
