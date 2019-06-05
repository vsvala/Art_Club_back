require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
const usersRouter = require('./controllers/users')
// const loginRouter = require('./controllers/login')
const artworksRouter = require('./controllers/artworks')


// Middleware
app.use(express.static('build'))
app.use(bodyParser.json())
app.use(cors())

app.use('/api/users', usersRouter)
app.use('/api/artworks', artworksRouter)
// app.use('/api/login', loginRouter)


const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})