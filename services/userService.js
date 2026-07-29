const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Artwork = require("../models/artwork");
const logger = require("../utils/logger");
const { deleteFromCloudinary } = require("../utils/upload");

const SALT_ROUNDS = 10;

const getAllUsers = async () => {
  const users = await User.find({}).populate("artworks", {
    artist: 1,
    name: 1,
    year: 1,
    size: 1,
    medium: 1,
    galleryImage: 1,
  });
  return users.map((u) => u.toJSON());
};

const getAllArtists = async () => {
  const users = await User.find({}).select("name intro artworks").populate("artworks", {
    artist: 1,
    name: 1,
    year: 1,
    size: 1,
    medium: 1,
    galleryImage: 1,
  });
  return users.map((u) => u.toJSON());
};

//gets single  user with specific id for logged user
const getUserById = async (id) => {
  const user = await User.findById(id).populate("artworks");
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user.toJSON();
};

const getSingleArtistById = async (id) => {
  const user = await User.findById(id).select("name intro artworks").populate("artworks");
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user.toJSON();
};

const registerUser = async ({ name, email, username, password }) => {
  // check that same username does not allready exist
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    const err = new Error("username must be unique");
    err.status = 400;
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = new User({
    name,
    email,
    username,
    passwordHash,
    role: "nonMember",
  });
  return (await user.save()).toJSON();
};

const updateUserRole = async ({ id, role }) => {
  const allowedRoles = ["member", "nonMember", "admin"];
  if (!allowedRoles.includes(role)) {
    const err = new Error("invalid role");
    err.status = 400;
    throw err;
  }
  const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, runValidators: true },
  );
  if (!updatedUser) {
    const err = new Error("user not found");
    err.status = 404;
    throw err;
  }
  return updatedUser.toJSON();
};

const changePassword = async ({ userId, oldPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("user not found");
    err.status = 404;
    throw err;
  }
  if (await bcrypt.compare(oldPassword, user.passwordHash)) {
    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
  } else {
    const err = new Error("old password does not match");
    err.status = 400;
    throw err;
  }
};
const updateUserIntro = async ({ userId, intro }) => {
  const updatedUser = await User.findByIdAndUpdate(userId, { intro }, { new: true });
  if (!updatedUser) {
    const err = new Error("user not found");
    err.status = 404;
    throw err;
  }
  return updatedUser.toJSON();
};

const updateUserInfo = async ({ userId, name, email, username }) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name, email, username },
    { new: true, runValidators: true },
  );
  if (!updatedUser) {
    const err = new Error("user not found");
    err.status = 404;
    throw err;
  }
  return updatedUser.toJSON();
};

const deleteUser = async (userId) => {
  const deletedUser = await User.findByIdAndDelete(userId);
  if (!deletedUser) {
    const err = new Error("user not found");
    err.status = 404;
    throw err;
  }
  const artworks = await Artwork.find({ user: userId });
  await Artwork.deleteMany({ user: userId });

  if (process.env.NODE_ENV !== "test") {
    await Promise.all(
      artworks
        .filter((artwork) => artwork.galleryImage)
        .map((artwork) =>
          deleteFromCloudinary(artwork.galleryImage).catch((cloudinaryError) => {
            logger.error(`Cloudinary delete failed: ${cloudinaryError.message}`);
          }),
        ),
    );
  }
};

module.exports = {
  registerUser,
  updateUserRole,
  changePassword,
  updateUserIntro,
  updateUserInfo,
  deleteUser,
  getAllArtists,
  getAllUsers,
  getUserById,
  getSingleArtistById,
};
