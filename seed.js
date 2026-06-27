require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const cloudinary = require('cloudinary').v2
const User = require('./models/user')
const Artwork = require('./models/artwork')
const Event = require('./models/event')

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env')
  process.exit(1)
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadToCloudinary = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, { folder: 'artclub' })
  return result.secure_url
}

const seed = async () => {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  await mongoose.connection.dropDatabase()
  console.log('Database cleared.')

  console.log('Uploading images to Cloudinary...')
  const img1 = await uploadToCloudinary('./uploads/1563988999871badgerweb.jpg')
  const img2 = await uploadToCloudinary('./uploads/1563989060359foxrollweb.jpg')
  const img3 = await uploadToCloudinary('./uploads/1564248858586bunnyweb.jpg')
  console.log('Images uploaded.')

  const passwordHash = await bcrypt.hash('admin123', 10)

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@artclub.com',
    username: 'admin',
    passwordHash,
    role: 'admin',
    intro: 'Art Club administrator',
    artworks: [],
  })

  const memberHash = await bcrypt.hash('member123', 10)

  const member = await User.create({
    name: 'Anna Artist',
    email: 'anna@artclub.com',
    username: 'anna',
    passwordHash: memberHash,
    role: 'member',
    intro: 'Painter and sculptor based in Helsinki.',
    artworks: [],
  })

  const artwork1 = await Artwork.create({
    name: 'Blue Morning',
    artist: 'Anna Artist',
    year: 2023,
    size: '60x80 cm',
    medium: 'Oil on canvas',
    likes: 0,
    galleryImage: img1,
    user: member._id,
  })

  const artwork2 = await Artwork.create({
    name: 'Urban Flow',
    artist: 'Anna Artist',
    year: 2024,
    size: '40x50 cm',
    medium: 'Acrylic on canvas',
    likes: 0,
    galleryImage: img2,
    user: member._id,
  })

  const artwork3 = await Artwork.create({
    name: 'Forest Study',
    artist: 'Anna Artist',
    year: 2024,
    size: '30x40 cm',
    medium: 'Watercolor',
    likes: 0,
    galleryImage: img3,
    user: member._id,
  })

  member.artworks = [artwork1._id, artwork2._id, artwork3._id]
  await member.save()

  await Event.create({
    title: 'Spring Exhibition Opening',
    place: 'Art Club Gallery, Helsinki',
    start: '2026-08-01',
    end: '2026-08-01',
    description: 'Join us for the opening night of our spring exhibition featuring works by club members.',
    user: admin._id,
  })

  await Event.create({
    title: 'Watercolor Workshop',
    place: 'Studio Room 2, Helsinki',
    start: '2026-08-15',
    end: '2026-08-15',
    description: 'A hands-on watercolor workshop for all skill levels. Materials provided.',
    user: admin._id,
  })

  console.log('Seed complete!')
  console.log('  admin    / admin123  (role: admin)')
  console.log('  anna     / member123 (role: member)')

  await mongoose.connection.close()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  mongoose.connection.close()
  process.exit(1)
})
