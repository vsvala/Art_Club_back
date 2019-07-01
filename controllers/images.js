const imageRouter = require('express').Router()
const Image = require('../models/image')
//const User = require('../models/user')
//const jwt = require('jsonwebtoken')
//const { authenticateToken } = require('../utils/checkRoute')
const multer = require('multer')
//var fs = require('fs')
//const upload = multer({ dest: 'uploads/' })

//multer saves image to folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null,'./public/uploads/')
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


imageRouter.post('/', upload.single('galleryImage'),(req, res,next) => {
  console.log('post reqfile', req.file)
  console.log('routerista')
  // const body = req.body
  //imageRouter.route('/')
  //.post(upload.single('imageData'),(req, res, next) => {
  console.log('routeristareqbody',req.body,req.body.imageName)
  console.log('routeristareqbody',req.body,req.body.artist)
  console.log('routeristaheaders',req.headers)
  console.log('routeristareqfile.path',req.file.path)

  const image = new Image({
    imageName:req.body.imageName,
    galleryImage: req.file.path }
  )

  // newImage.img.data = fs.readFileSync(req.files.userPhoto.path)
  // newImage.img.contentType = 'image/png'
  image.save()
    .then((result) => {
      console.log(result)
      res.status(200).json({
        succes:true,
        document:result
      })
    })
  //   imageName:req.body.name,
  //   imageData:'data'
  //   //imageData:req.file.path
  // })
  // newImage.save()
  //   .then((result) => {
  //     console.log(result)
  //     res.status(200).json({
  //       succes:true,
  //       document:result
  //     })
  //   })
    .catch((err) => next(err))
})

module.exports = imageRouter