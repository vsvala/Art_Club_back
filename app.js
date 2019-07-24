const config = require('./utils/config')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')

//Routrers
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const eventsRouter = require('./controllers/events')
const artworksRouter = require('./controllers/artworks')
const middleware = require('./utils/middleware.js')
const logger = require('./utils/logger')
const tokenCheckRouter = require('./controllers/tokenCheck')


logger.info('connecting to', config.MONGODB_URI)

// connecting to db throught config file
//console.log('commecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    //console.log('connected to MongoDB')
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    //console.log('error connection to MongoDB:', error.message)
    logger.error('error connection to MongoDB:', error.message)
  })

mongoose.set('useCreateIndex', true)

// Middlewares
app.use(express.static('build'))
app.use(bodyParser.json())
app.use(middleware.requestLogger)
app.use(express.static('build'))
app.use('/uploads',express.static('uploads'))//create a static path reference to folder
app.use('/public/uploads',express.static('uploads'))
app.use(cors())

app.use('/api/users', usersRouter)
app.use('/api/artworks', artworksRouter)
app.use('/api/events', eventsRouter)
app.use('/api/login', loginRouter)
app.use('/api/tokenCheck', tokenCheckRouter)
//app.use('/api/images', imageRouter)//express.static('uploads'))//statistic path for the images//, imageRouter

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app