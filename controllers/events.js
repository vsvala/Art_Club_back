const eventsRouter = require('express').Router()
const multer = require('multer')
const Event = require('../models/event')
const User = require('../models/user')
//const { authenticateToken } = require('../utils/checkRoute')
const {  checkLogin, checkAdmin } = require('../utils/checkRoute')


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
eventsRouter.get('/',checkLogin, async(req, res) => {
  try {
    const events = await Event.find({})
      .populate('user', { username: 1, name: 1 })
    res.json(events.map(event => event.toJSON()))

  } catch (exception) {
    console.log(exception.message)
    res.status(400).json({ error: 'Could not get eventList from db' })
  }
})

//posting events for admin
eventsRouter.post('/', upload.single('eventImage'),checkAdmin, async(req, res) => {
  console.log('reqfile', req.file)
  const body = req.body
  console.log('eventbody', body.userId)

  console.log('routerista',body.config)
  console.log('routerista headers',req.headers)
  console.log('routeristadata',req.file.path)
  /*   AUTORISOINTI
  const decodedToken = authenticateToken(req)
  const user =  User.findById(decodedToken.id)//await
 */
  try {
    const user = await User.findById(body.userId)

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
  } catch (error) {
    console.log(error.message)
    res.status(400).json({ error: 'bad req' })
  }
})

//delete event for admin
eventsRouter.delete('/:id', checkAdmin, async (req, res, next) => {
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

// // heroku reload page fix
// eventsRouter.get('/*', async(req, res) => {
// // await res.sendFile('/build/index.html')
//   await res.sendFile('/build/public/index.html', { root: __dirname })

// })


module.exports = eventsRouter