const config = require('./utils/config')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
const usersRouter = require('./controllers/users')
// const loginRouter = require('./controllers/login')
const artworksRouter = require('./controllers/artworks')
const middleware = require('./utils/middleware.js')
const mongoose = require('mongoose')


// connecting to db throught config file
console.log('commecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })




// Middleware
app.use(express.static('build'))
app.use(bodyParser.json())
app.use(middleware.logger)

app.use(cors())

app.use('/api/users', usersRouter)
app.use('/api/artworks', artworksRouter)
// app.use('/api/login', loginRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app