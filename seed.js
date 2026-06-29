require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary");
const User = require("./models/user");
const Artwork = require("./models/artwork");
const Event = require("./models/event");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not set in .env");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "artclub",
  });
  return result.secure_url;
};

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  await mongoose.connection.dropDatabase();
  console.log("Database cleared.");

  console.log("Uploading images to Cloudinary...");
  const ketut = await uploadToCloudinary("./uploads/ketut.jpg");
  const jano = await uploadToCloudinary("./uploads/jano.jpg");
  const mayra = await uploadToCloudinary("./uploads/mayra.jpg");
  console.log("Images uploaded.");

  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 10);

  const admin = await User.create({
    name: "Admin User",
    email: "admin@artclub.com",
    username: "admin",
    passwordHash,
    role: "admin",
    intro: "Art Club administrator",
    artworks: [],
  });

  const memberHash = await bcrypt.hash(process.env.SEED_MEMBER_PASSWORD, 10);

  const member = await User.create({
    name: "Anna Artist",
    email: "anna@artclub.com",
    username: "anna",
    passwordHash: memberHash,
    role: "member",
    intro: "Painter and sculptor based in Helsinki.",
    artworks: [],
  });

  const artwork1 = await Artwork.create({
    name: "Friends 4 ever",
    artist: "Anna Artist",
    year: 2023,
    size: "60x80 cm",
    medium: "Oil on canvas",
    likes: 0,
    galleryImage: ketut,
    user: member._id,
  });

  const artwork2 = await Artwork.create({
    name: "Sleeping bunny",
    artist: "Anna Artist",
    year: 2024,
    size: "40x50 cm",
    medium: "Acrylic on canvas",
    likes: 0,
    galleryImage: jano,
    user: member._id,
  });

  const artwork3 = await Artwork.create({
    name: "leeping Badgers",
    artist: "Anna Artist",
    year: 2024,
    size: "30x40 cm",
    medium: "Watercolor",
    likes: 0,
    galleryImage: mayra,
    user: member._id,
  });

  member.artworks = [artwork1._id, artwork2._id, artwork3._id];
  await member.save();

  await Event.create({
    title: "Spring Exhibition Opening",
    place: "Art Club Gallery, Helsinki",
    start: "2026-08-01",
    end: "2026-08-01",
    description:
      "Join us for the opening night of our spring exhibition featuring works by club members.",
    user: admin._id,
  });

  await Event.create({
    title: "Watercolor Workshop",
    place: "Studio Room 2, Helsinki",
    start: "2026-08-15",
    end: "2026-08-15",
    description:
      "A hands-on watercolor workshop for all skill levels. Materials provided.",
    user: admin._id,
  });

  console.log("Seed complete!");
  console.log(
    "  admin    /",
    process.env.SEED_ADMIN_PASSWORD,
    " (role: admin)",
  );
  console.log(
    "  anna     /",
    process.env.SEED_MEMBER_PASSWORD,
    " (role: member)",
  );

  await mongoose.connection.close();
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  mongoose.connection.close();
  process.exit(1);
});
