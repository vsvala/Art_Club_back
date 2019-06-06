const artworksRouter = require('express').Router()
const Artwork = require('../models/artwork')
const User = require('../models/user')

// artworksRouter.get('/', (req, res) => {
//   res.send('<h1>Hello World!</h1>')
// })

//gets all artworks
artworksRouter.get('/', async(req, res) => {
  const artworks = await Artwork.find({})
  res.json(artworks.map(artwork => artwork.toJSON()))
})


//gets single  artwork with specific id
artworksRouter.get('/:id',async (req, res, next) => {
  try{
    const artwork = await Artwork.findById(req.params.id)
    if(artwork){
      res.json(artwork.toJSON())
    }else{
      res.status(404).end()
    }
  }catch(exception){
    next(exception)
  }
  // (error => {
  //   console.log(error)
  //   res.status(400).send({ error: 'malformatted id' })
  // })
})

artworksRouter.post('/',async (req, res, next) => {
  const body = req.body

  const user = await User.findById(body.userId)
  console.log('user', user)

  if (body.image === undefined) {
    return res.status(400).json({ error: 'image missing' })
  }
  console.log('artwork', body)

  const artwork = new Artwork({
    image: body.image,
    artist: body.artist,
    name: body.name,
    year: body.year,
    size: body.size,
    medium:body.medium,
    user: user._id,
  })

  try {
    const savedArtwork = await artwork.save()
    user.artworks = user.artworks.concat(savedArtwork._id)
    await user.save()

    res.json(savedArtwork.toJSON())

  } catch(exception) {
    next(exception)
  }
})

artworksRouter.put('/:id', (req, res, next) => {
  const body = req.body

  const artwork = {
    image: body.image,
    artist: body.artist,
    name: body.name,
    year: body.year,
    size: body.size,
    medium:body.medium,
  }

  Artwork.findByIdAndUpdate(req.params.id, artwork, { new: true })
    .then(updatedArtwork => {
      res.json(updatedArtwork.toJSON())
    })
    .catch(error => next(error))
})


artworksRouter.delete('/:id', async (req, res, next) => {
  try {
    await Artwork.findByIdAndRemove(req.params.id)
    res.status(204).end()
  } catch (exception) {
    next(exception)
  }
})

module.exports = artworksRouter

// const artwork = new Artwork({
//   image: 'sleebybear.jpg',
//   artist: 'Virva Svala',
//   name: 'Sleepy bear',
//   year: 2017,
//   size: '20x30cm',
//   medium:'aquarelle',
// })
// artwork.save().then(savedArtwork => {
//   res.json(savedArtwork.toJSON())
// })