const artworksRouter = require('express').Router()
const multer = require('multer')
const Artwork = require('../models/artwork')
const User = require('../models/user')
const { checkLogin } = require('../utils/checkRoute')

const express = require('express')
const path = require('path')
// const cloudinary = require('cloudinary')
// const cloudinaryStorage = require('multer-storage-cloudinary')


// Serve the static files from the React app
artworksRouter.use(express.static(path.join(__dirname, 'https://artclub-project.herokuapp.com/build')))


//multer saves image to folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null,'./uploads/')//./public
    console.log('storage')
  },
  filename:function(req, file, cb) {
    cb(null, Date.now() + file.originalname)
    console.log('filename')
  }
})
const fileFilter = (req, file, cb) => {
  //rejects storing a nonpicture file
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'|| file.mimetype === 'image/pdf' || file.mimetype === 'image/gif') {
    cb(null,true)
    console.log('mimetype true')
  }else{
    console.log('false')
    cb(null,false)
  }
}
const upload = multer({ storage: storage, limits:{
  fileSize:1024*1024*5
},
fileFilter:fileFilter
})

// gets all artworks and populates user details
artworksRouter.get('/', async(req, res, next) => {
  try{
    const artworks = await Artwork.find({})
      .populate('user', { username: 1, name: 1 })
    res.status(200).json(artworks.map(artwork => artwork.toJSON()))  }
  catch(exception) {
    next(exception)
  }
})


//gets single artwork with specific id
artworksRouter.get('/:id', async (req, res, next) => {
  try{
    const artwork = await Artwork.findById(req.params.id)
    if(artwork){
      res.status(200).json(artwork.toJSON())
    }else{
      res.status(404).end()
    }
  }catch(exception){
    next(exception)
  }
})

// creating artwork
artworksRouter.post('/', checkLogin, upload.single('galleryImage'), async(req, res) => {
  //console.log('reqfile', req.file)
  const body = req.body
  // console.log('artworkbody', body.userId)
  // console.log('routerista',body.config)
  // console.log('routerista headers',req.headers)
  // console.log('routeristadata',req.file.path)
  //const decodedToken = authenticateToken(req)
  //const user =  User.findById(decodedToken.id)

  try {
    const user = await User.findById(body.userId)

    const artwork = new Artwork({
      galleryImage: req.file.path,
      artist: req.body.artist,
      name: req.body.name,
      year: req.body.year,
      size: req.body.size,
      medium:req.body.medium,
      likes: req.body.likes === '' ? false : req.body.likes === 0,
      user:req.body.userId
      //user: user._id,
    })
    const savedArtwork =await artwork.save()
    console.log('savedartwolrid',savedArtwork)
    //TODOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO id vai artwork
    //savedArtwork.id
    user.artworks = await user.artworks.concat(savedArtwork.id)
    await user.save()
    res.status(200).json(savedArtwork)

  } catch (error) {
    console.log(error.message)
    res.status(400).json({ error: 'bad req' })
  }
})


// deletes artwork url and image file from uploads folder
artworksRouter.delete('/:id',checkLogin, async (req, res, next) => {
  try {

    //const decodedToken = authenticateToken(req)
    //console.log('decoderdT',decodedToken)
    // const user = await User.findById(decodedToken.id)
    // console.log('user',user)

    //filter away artwork from users artworkList
    //await Artwork.User.update(
    //   { 'artwork': req.params.id },
    //   { '$pull': { 'user':user.id } },
    //   function (err, res){
    //     if (err) throw err
    //     res.json(res)
    //   }
    // )
    // await User.update({ _id: user.id }, { '$pull': { 'artworks': {'ObjectId': 'req.params.id' } } } )
    const artwork = await Artwork.findByIdAndRemove(req.params.id)

    //deleting image from uploads folder
    console.log(' artwork.galleryImage', artwork.galleryImage)
    const fs = require('fs')
    const filePath = './'+ artwork.galleryImage
    fs.access(filePath, error => {
      if (!error) {
        fs.unlinkSync(filePath)
      } else {
        console.log(error)
      }
    })
    res.status(204).end() //No Content success
  } catch (exception) {
    next(exception)
  }
})

//update likes
artworksRouter.put('/:id', async(req, res) => {
// const body = req.body
  console.log('bodyId', req.body.id)
  try {
    //const artwork = await Artwork.findById(req.params.id)
    const artwork= await Artwork.findById(req.body.id)
    await artwork.update(
      { likes:req.body.likes
      })
    res.json(artwork.toJSON())
  } catch (exception) {
    console.log(exception)
    res.status(500).json({ error: 'did not update likes, something went wrong...' })
  }
})


// heroku reload page fix
artworksRouter.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname+'/https://artclub-project.herokuapp.com/build/index.html'))
})



module.exports = artworksRouter
