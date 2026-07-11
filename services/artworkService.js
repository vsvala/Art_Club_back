const Artwork = require("../models/artwork");
const User = require("../models/user");
const logger = require("../utils/logger");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/upload");

const getArtworks = async ({ page, limit }) => {
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const skip = (page - 1) * limit;
  const [artworks, total] = await Promise.all([
    Artwork.find({})
      .populate("user", { username: 1, name: 1 })
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit),
    Artwork.countDocuments({}),
  ]);
  return {
    artworks: artworks.map((a) => a.toJSON()),
    total,
    page,
    limit,
    hasMore: skip + artworks.length < total,
  };
};

const getArtworkById = async (id) => {
  const artwork = await Artwork.findById(id);
  if (!artwork) {
    const err = new Error("artwork not found");
    err.status = 404;
    throw err;
  }
  return artwork.toJSON();
};

const createArtwork = async ({ body, file, userId }) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("user not found");
    err.status = 404;
    throw err;
  }
  if (!file) {
    const err = new Error("No file uploaded");
    err.status = 400;
    throw err;
  }
  const imageUrl =
    process.env.NODE_ENV === "test"
      ? // Avoid real Cloudinary calls in tests — they're slow, cost quota,
        // and require network access CI may not have.
        "https://placehold.co/100x100.png"
      : await uploadToCloudinary(file.buffer, file.mimetype);

  const artwork = new Artwork({
    galleryImage: imageUrl,
    artist: body.artist,
    name: body.name,
    year: body.year,
    size: body.size,
    medium: body.medium,
    likes: 0,
    user: userId,
  });
  const savedArtwork = await artwork.save();
  user.artworks = user.artworks.concat(savedArtwork.id);
  await user.save();
  return savedArtwork.toJSON();
};

const deleteArtwork = async ({ artworkId, userId, role }) => {
  const artwork = await Artwork.findById(artworkId);
  if (!artwork) {
    const err = new Error("artwork not found");
    err.status = 404;
    throw err;
  }
  const isOwner = artwork.user.toString() === userId.toString();
  const isAdmin = role === "admin";
  if (!isOwner && !isAdmin) {
    const err = new Error("forbidden");
    err.status = 403;
    throw err;
  }
  await Artwork.findByIdAndDelete(artworkId);
  if (artwork.galleryImage && process.env.NODE_ENV !== "test") {
    try {
      await deleteFromCloudinary(artwork.galleryImage);
    } catch (cloudinaryError) {
      // Artwork is already deleted from the DB; a failed Cloudinary
      // cleanup shouldn't roll that back or fail the request.
      logger.error(`Cloudinary delete failed: ${cloudinaryError.message}`);
    }
  }
};

const updateArtworkLikes = async ({ artworkId, likes }) => {
  const artwork = await Artwork.findById(artworkId);
  if (!artwork) {
    const err = new Error("artwork not found");
    err.status = 404;
    throw err;
  }
  await Artwork.findByIdAndUpdate(artworkId, { likes });
  return artwork.toJSON();
};

module.exports = {
  getArtworks,
  getArtworkById,
  createArtwork,
  deleteArtwork,
  updateArtworkLikes,
};
