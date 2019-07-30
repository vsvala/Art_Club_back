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
app.use(cors())
app.use(express.static('build'))
app.use(bodyParser.json())
app.use(middleware.requestLogger)
app.use(express.static('build'))
app.use('/uploads',express.static('uploads'))//create a static path reference to folder
app.use('/public/uploads',express.static('uploads'))

if (process.env.NODE_ENV === 'production') {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'client/build')));// Handle React routing, return all requests to React app
  app.get('*', function(req, res) {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });

const apiUrl = '/api'
app.use(`${apiUrl}/users`, usersRouter)
app.use(`${apiUrl}/artworks`, artworksRouter)
app.use(`${apiUrl}/events`, eventsRouter)
app.use(`${apiUrl}/login`, loginRouter)
app.use(`${apiUrl}/tokenCheck`, tokenCheckRouter)


app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app