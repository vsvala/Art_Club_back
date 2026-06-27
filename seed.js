require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const User = require('./models/user')
const Artwork = require('./models/artwork')
const Event = require('./models/event')

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env')
  process.exit(1)
}

const seed = async () => {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  const existingUsers = await User.countDocuments()
  if (existingUsers > 0) {
    console.log('Database already has data, skipping seed.')
    await mongoose.connection.close()
    return
  }

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
    user: member._id,
  })

  const artwork2 = await Artwork.create({
    name: 'Urban Flow',
    artist: 'Anna Artist',
    year: 2024,
    size: '40x50 cm',
    medium: 'Acrylic on canvas',
    likes: 0,
    user: member._id,
  })

  member.artworks = [artwork1._id, artwork2._id]
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
