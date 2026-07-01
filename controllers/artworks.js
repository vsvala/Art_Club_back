const artworksRouter = require("express").Router();
const multer = require("multer");
const Artwork = require("../models/artwork");
const User = require("../models/user");
const logger = require("../utils/logger");
const { checkLogin } = require("../utils/checkRoute");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/pdf" ||
    file.mimetype === "image/gif"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: fileFilter,
});

const uploadToCloudinary = (buffer, mimetype) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "artclub" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

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
      const user = await User.findById(body.userId);
      const imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

      const artwork = new Artwork({
        galleryImage: imageUrl,
        artist: req.body.artist,
        name: req.body.name,
        year: req.body.year,
        size: req.body.size,
        medium: req.body.medium,
        likes: req.body.likes === "" ? false : req.body.likes === 0,
        user: req.body.userId,
      });
      const savedArtwork = await artwork.save();
      user.artworks = await user.artworks.concat(savedArtwork.id);
      await user.save();
      res.status(200).json(savedArtwork);
    } catch (error) {
      logger.error(error.message);
      res.status(400).json({ error: "bad req" });
    }
  },
);

// deletes artwork url and image file from uploads folder
artworksRouter.delete("/:id", checkLogin, async (req, res, next) => {
  try {
    const artwork = await Artwork.findByIdAndDelete(req.params.id);
    if (artwork && artwork.galleryImage) {
      try {
        const urlParts = artwork.galleryImage.split("/");
        const filenameWithExt = urlParts[urlParts.length - 1];
        const filename = filenameWithExt.split(".")[0];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${filename}`;
        await cloudinary.uploader.destroy(publicId);
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
artworksRouter.put("/:id", async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.body.id);
    await Artwork.findByIdAndUpdate(req.body.id, { likes: req.body.likes });
    res.json(artwork.toJSON());
  } catch (exception) {
    logger.error(exception.message);
    res
      .status(500)
      .json({ error: "did not update likes, something went wrong..." });
  }
});

module.exports = artworksRouter;
