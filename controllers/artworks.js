const artworksRouter = require('express').Router()
const multer = require('multer')
const Artwork = require('../models/artwork')
const User = require('../models/user')
//const jwt = require('jsonwebtoken')
//const { authenticateToken } = require('../utils/checkRoute')


//multer saves image to folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null,'./uploads/')
    console.log('storage')
  },
  filename:function(req, file, cb) {
    cb(null, Date.now() + file.originalname)
    console.log('filename')
  }
})
const fileFilter = (req, file, cb) => {
//     //rejects storing a file
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'|| file.mimetype === 'image/pdf') {
    cb(null,true)
    console.log('mimetype true')
  }else{
    console.log('false')
    cb(null,false)
  }
}

const upload = multer({ storage: storage, limits:{
  fileSize:1024*1024 *5
},
fileFilter:fileFilter
})


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

artworksRouter.post('/', upload.single('galleryImage'),(req, res, next) => { //async
  console.log('reqfile', req.file)
  const body = req.body
  console.log('artworkbody', body.userId)

  //console.log('routerista',body.config)
  console.log('routerista headers',req.headers)
  console.log('routeristadata',req.file.path)

  //const token = getTokenFrom(req)
  // try {
  //   const decodedToken = jwt.verify(token, process.env.SECRET)
  //   if (!token || !decodedToken.id) {
  //     return res.status(401).json({ error: 'token missing or invalid' })
  //

  /*   AUTORISOINTI
  const decodedToken = authenticateToken(req)
  const user =  User.findById(decodedToken.id)//await
 */
  //
  //tää pitää kai parsia
  //const user = User.findById(body.userId)// await
  //console.log('user_____________________________________________', user)

  /*   if (body.artist === undefined) {
    return res.status(400).json({ error: 'artist missing' })
  } */
  //console.log('artwork_______________________________________________________________________________________________', body)

  const artwork = new Artwork({
    galleryImage: req.file.path,
    artist: req.body.artist,
    name: req.body.name,
    year: req.body.year,
    size: req.body.size,
    medium:req.body.medium,
    user:req.body.userId
    //user: user._id,
  })
  artwork.save()
  // const savedArtwork = artwork.save()//await
  //user.artworks = user.artworks.concat(savedArtwork._id)
  //user.save() // await
    .then((result) => {
      console.log(result)
      res.status(200).json({
        succes:true,
        document:result
        //res.json(savedArtwork.toJSON())

        // } catch(exception) {
        //   next(exception)
        // }
      })
        .catch((err) => next(err))

    })
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