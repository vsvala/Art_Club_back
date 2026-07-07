const artworksRouter = require("express").Router();
const Artwork = require("../models/artwork");
const User = require("../models/user");
const logger = require("../utils/logger");
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/upload");
const { authenticateToken, checkLogin } = require("../utils/checkRoute");

// gets all artworks and populates user details
artworksRouter.get("/", async (req, res, next) => {
  try {
    const artworks = await Artwork.find({}).populate("user", {
      username: 1,
      name: 1,
    });
    res.status(200).json(artworks.map((artwork) => artwork.toJSON()));
  } catch (exception) {
    next(exception);
  }
});

//gets single artwork with specific id
artworksRouter.get("/:id", async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (artwork) {
      res.status(200).json(artwork.toJSON());
    } else {
      res.status(404).end();
    }
  } catch (exception) {
    next(exception);
  }
});

// creating artwork
artworksRouter.post(
  "/",
  checkLogin,
  upload.single("galleryImage"),
  async (req, res) => {
    const body = req.body;
    try {
      const token = authenticateToken(req);
      const user = await User.findById(token.id);
      if (!user) return res.status(404).json({ error: "user not found" });

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const imageUrl =
        process.env.NODE_ENV === "test"
          ? "https://placehold.co/100x100.png"
          : await uploadToCloudinary(req.file.buffer, req.file.mimetype);

      const artwork = new Artwork({
        galleryImage: imageUrl,
        artist: req.body.artist,
        name: req.body.name,
        year: req.body.year,
        size: req.body.size,
        medium: req.body.medium,
        likes: 0,
        user: token.id,
      });
      const savedArtwork = await artwork.save();
      user.artworks = await user.artworks.concat(savedArtwork.id);
      await user.save();
      res.status(200).json(savedArtwork.toJSON());
    } catch (error) {
      logger.error(error.message);
      res.status(400).json({ error: "bad req" });
    }
  },
);

// deletes artwork url and image file from uploads folder
artworksRouter.delete("/:id", checkLogin, async (req, res, next) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) {
      return res.status(404).json({ error: "artwork not found" });
    }

    const token = authenticateToken(req);
    const isOwner = artwork.user.toString() === token.id.toString();
    const isAdmin = token.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "forbidden" });
    }

    await Artwork.findByIdAndDelete(req.params.id);

    if (artwork.galleryImage && process.env.NODE_ENV !== "test") {
      try {
        await deleteFromCloudinary(artwork.galleryImage);
      } catch (cloudinaryError) {
        logger.error(`Cloudinary delete failed: ${cloudinaryError.message}`);
      }
    }
    res.status(204).end();
  } catch (exception) {
    next(exception);
  }
});

//update likes
artworksRouter.put("/:id", checkLogin, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    await Artwork.findByIdAndUpdate(req.params.id, { likes: req.body.likes });
    res.json(artwork.toJSON());
  } catch (exception) {
    logger.error(exception.message);
    res
      .status(500)
      .json({ error: "did not update likes, something went wrong..." });
  }
});

module.exports = artworksRouter;
