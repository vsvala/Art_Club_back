const artworksRouter = require('express').Router()
const multer = require('multer')
const Artwork = require('../models/artwork')
const User = require('../models/user')
//const jwt = require('jsonwebtoken')
//const { authenticateToken } = require('../utils/checkRoute')


//TODO authentication and error cleaning


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
//     //rejects storing a file
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
artworksRouter.get('/', async(req, res) => {
  const artworks = await Artwork.find({})
    .populate('user', { username: 1, name: 1 })
  res.json(artworks.map(artwork => artwork.toJSON()))
})



// creating artwork
artworksRouter.post('/', upload.single('galleryImage'),async(req, res) => {
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
  try {
    const user = await User.findById(body.userId)// await
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
    //artwork.save()
    const savedArtwork =await artwork.save()//await
    console.log('savedartwolrid',savedArtwork)

    //savedArtwork.id
    user.artworks = await user.artworks.concat(savedArtwork)
    await user.save() // await

    //  .then((result) => {
    // console.log(result)
    res.status(200).json(savedArtwork)
    //({
    // succes:true,
    // document:result
    //res.json(savedArtwork.toJSON())

    // } catch(exception) {
    //   next(exception)
    // }
    // })
    //  .catch((err) => next(err))
  } catch (error) {
    console.log(error.message)
    res.status(400).json({ error: 'bad req' })
  }
})


// deletes artwork url and image file from uploads folder
artworksRouter.delete('/:id', async (req, res, next) => {// checkLogin,
  try {

    //const decodedToken = authenticateToken(req)
    // const user = await User.findById(decodedToken.id)

    // await Artwork.User.update(
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
    res.status(204).end()
  } catch (exception) {
    next(exception)
  }
})

module.exports = artworksRouter
