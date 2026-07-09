require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");
const User = require("./models/user");
const Artwork = require("./models/artwork");
const Event = require("./models/event");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not set in .env");
  process.exit(1);
}

const shouldUseCloudinary =
  process.env.NODE_ENV === "production" ||
  process.env.SEED_UPLOAD_TO_CLOUDINARY === "true";
const cloudinaryFolder = process.env.CLOUDINARY_SEED_FOLDER || "artclub";
const MAX_ARTWORKS_PER_ARTIST = 10;

if (shouldUseCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const getUploadImages = () => {
  const uploadsDir = path.join(__dirname, "uploads");
  const supportedExtensions = new Set([".jpg", ".jpeg", ".png", ".jpf"]);

  return fs
    .readdirSync(uploadsDir)
    .filter((fileName) => {
      const ext = path.extname(fileName).toLowerCase();
      return supportedExtensions.has(ext);
    })
    .sort();
};

const titleFromFileName = (fileName) => {
  const raw = path.parse(fileName).name;
  const cleaned = raw
    .replace(/\bcopy\b/gi, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "Untitled";

  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const createCloudinaryPublicId = (fileName) => {
  const baseName = path.parse(fileName).name;
  const slug = baseName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const safeName =
    slug || `image-${Buffer.from(fileName).toString("hex").slice(0, 12)}`;

  return `${cloudinaryFolder}/${safeName}`;
};

const getCloudinaryHttpCode = (error) => {
  if (!error) return undefined;
  if (typeof error.http_code === "number") return error.http_code;
  if (error.error && typeof error.error.http_code === "number") {
    return error.error.http_code;
  }
  return undefined;
};

const ensureCloudinaryImage = async (fileName) => {
  const publicId = createCloudinaryPublicId(fileName);

  try {
    const existing = await cloudinary.api.resource(publicId, {
      resource_type: "image",
    });
    return { secureUrl: existing.secure_url, uploaded: false };
  } catch (error) {
    const httpCode = getCloudinaryHttpCode(error);
    if (httpCode !== 404) {
      throw error;
    }
  }

  const localPath = path.join(__dirname, "uploads", fileName);
  const uploaded = await cloudinary.uploader.upload(localPath, {
    folder: cloudinaryFolder,
    public_id: path.basename(publicId),
    unique_filename: false,
    overwrite: false,
    resource_type: "image",
  });

  return { secureUrl: uploaded.secure_url, uploaded: true };
};

const resolveGalleryImage = async (fileName) => {
  if (!shouldUseCloudinary) {
    return { imageUrl: `/uploads/${fileName}`, uploaded: false };
  }

  const cloudinaryImage = await ensureCloudinaryImage(fileName);
  return {
    imageUrl: cloudinaryImage.secureUrl,
    uploaded: cloudinaryImage.uploaded,
  };
};

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  await mongoose.connection.dropDatabase();
  console.log("Database cleared.");

  const imageFiles = getUploadImages();
  if (imageFiles.length === 0) {
    throw new Error("No images found from uploads folder");
  }
  console.log(`Found ${imageFiles.length} image(s) from uploads.`);
  console.log(
    shouldUseCloudinary
      ? `Cloudinary mode ON (folder: ${cloudinaryFolder})`
      : "Cloudinary mode OFF (using local /uploads paths)",
  );

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

  const baseMemberSeedData = [
    {
      name: "Anna Artist",
      email: "anna@artclub.com",
      username: "anna",
      intro: "Painter and sculptor based in Helsinki.",
    },
    {
      name: "Mika Watercolor",
      email: "mika@artclub.com",
      username: "mika",
      intro: "Nature inspired watercolor painter.",
    },
    {
      name: "Liisa Sketch",
      email: "liisa@artclub.com",
      username: "liisa",
      intro: "Mixed-media and sketchbook enthusiast.",
    },
    {
      name: "Olli Canvas",
      email: "olli@artclub.com",
      username: "olli",
      intro: "Acrylic painter exploring color studies.",
    },
  ];

  const requiredMemberCount = Math.ceil(
    imageFiles.length / MAX_ARTWORKS_PER_ARTIST,
  );

  const memberSeedData = Array.from({ length: requiredMemberCount }, (_, i) => {
    if (i < baseMemberSeedData.length) {
      return baseMemberSeedData[i];
    }

    const index = i + 1;
    return {
      name: `Seed Artist ${index}`,
      email: `seed.artist${index}@artclub.com`,
      username: `seedartist${index}`,
      intro: "Art Club member generated by seed script.",
    };
  });

  const members = [];
  for (const memberData of memberSeedData) {
    const member = await User.create({
      ...memberData,
      passwordHash: memberHash,
      role: "member",
      artworks: [],
    });
    members.push(member);
  }

  const mediaByIndex = [
    "Oil on canvas",
    "Acrylic on canvas",
    "Watercolor",
    "Mixed media",
    "Digital illustration",
  ];

  const sizeByIndex = ["30x40 cm", "40x50 cm", "50x70 cm", "60x80 cm"];

  const createdArtworksByUser = new Map();
  let uploadedCount = 0;
  let reusedCount = 0;
  for (const member of members) {
    createdArtworksByUser.set(member.id, []);
  }

  for (let i = 0; i < imageFiles.length; i++) {
    const fileName = imageFiles[i];
    const ownerIndex = Math.floor(i / MAX_ARTWORKS_PER_ARTIST);
    const owner = members[ownerIndex];
    const { imageUrl, uploaded } = await resolveGalleryImage(fileName);
    if (shouldUseCloudinary) {
      if (uploaded) uploadedCount += 1;
      else reusedCount += 1;
    }

    const artwork = await Artwork.create({
      name: titleFromFileName(fileName),
      artist: owner.name,
      year: 2021 + (i % 6),
      size: sizeByIndex[i % sizeByIndex.length],
      medium: mediaByIndex[i % mediaByIndex.length],
      likes: i % 7,
      galleryImage: imageUrl,
      user: owner._id,
    });
    createdArtworksByUser.get(owner.id).push(artwork._id);
  }

  for (const member of members) {
    member.artworks = createdArtworksByUser.get(member.id);
    await member.save();
  }

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
    "  members  /",
    process.env.SEED_MEMBER_PASSWORD,
    ` (role: member, users created: ${members.length}, max artworks/artist: ${MAX_ARTWORKS_PER_ARTIST})`,
  );
  console.log(`  artworks seeded: ${imageFiles.length}`);
  if (shouldUseCloudinary) {
    console.log(`  cloudinary uploaded: ${uploadedCount}`);
    console.log(`  cloudinary reused: ${reusedCount}`);
  }

  await mongoose.connection.close();
};

seed().catch((err) => {
  console.error("Seed failed:", err);
  mongoose.connection.close();
  process.exit(1);
});
