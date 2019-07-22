const eventsRouter = require('express').Router()
const multer = require('multer')
const Event = require('../models/event')
const User = require('../models/user')
//const jwt = require('jsonwebtoken')
//const { authenticateToken } = require('../utils/checkRoute')


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
//rejects storing a file if not image
const fileFilter = (req, file, cb) => {

  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'|| file.mimetype === 'image/pdf'  || file.mimetype === 'image/gif') {
    cb(null,true)
    console.log('mimetype true')
  }else{
    console.log('not supportet format')
    cb(null,false)
  }
}
//filesize limitations
const upload = multer({ storage: storage, limits:{ fileSize:1024*1024 *5
},
fileFilter:fileFilter
})


//gets all events
eventsRouter.get('/', async(req, res) => {
  const events = await Event.find({})
    .populate('user', { username: 1, name: 1 })
  res.json(events.map(event => event.toJSON()))
})



eventsRouter.post('/', upload.single('eventImage'),async(req, res) => {
  console.log('reqfile', req.file)
  const body = req.body
  console.log('eventbody', body.userId)

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

  try {
    const user = await User.findById(body.userId)// await
    //console.log('user_____________________________________________', user)
    /*   if (body.artist === undefined) {
    return res.status(400).json({ error: 'artist missing' })
  } */

    const event = new Event({
      eventImage: req.file.path,
      title: req.body.title,
      place: req.body.place,
      start: req.body.start,
      end: req.body.end,
      description:req.body.description,
      user:user
    })
    const savedEvent =await event.save()
    console.log('savedEvent',savedEvent)
    //user.events = await user.events.concat(savedEvent)
    //await user.save()
    res.status(200).json(savedEvent)
    //res.json(savedEvent.toJSON())
    // } catch(exception) {
    //   next(exception)
    // }
    // })
  } catch (error) {
    console.log(error.message)
    res.status(400).json({ error: 'bad req' })
  }
})


eventsRouter.delete('/:id', async (req, res, next) => {
  try {
    const event = await Event.findByIdAndRemove(req.params.id)
    console.log(' artwork.eventImage', event.eventImage)
    const fs = require('fs')
    const filePath = './'+ event.eventImage
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

module.exports = eventsRouter