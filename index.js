require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors')
const Artwork = require('./models/artwork')


// Middleware
app.use(express.static('build'))
app.use(bodyParser.json())
app.use(cors())


app.get('/', (req, res) => {
  res.send('<h1>Hello World!</h1>')
})

//gets all arworks
app.get('/api/artworks', (req, res) => {
  Artwork.find({}).then(artwork => {
    res.json(artwork.map(artwork => artwork.toJSON()))
  })
})

//gets single  artwork with specific id
app.get('/api/artworks/:id', (req, res) => {
  Artwork.findById(req.params.id) //Number?
    .then(artwork => {
      if(artwork){
        res.json(artwork.toJSON())
      }else{
        res.status(404).end()
      }
    })
    .catch(error => {
      console.log(error)
      res.status(400).send({ error: 'malformatted id' })
    })
})

app.post('/api/artworks', (req, res) => {
  const body = req.body

  if (body.image === undefined) {
    return res.status(400).json({ error: 'image missing' })
  }

  const artwork = new Artwork({
    image: 'sleebybear.jpg',
    artist: 'Virva Svala',
    name: 'Sleepy bear',
    year: 2017,
    size: '20x30cm',
    medium:'aquarelle',
  })

  artwork.save().then(savedArtwork => {
    res.json(savedArtwork.toJSON())
  })
})

//deleting  artwork
// app.delete('/api/artworks/:id', (req, res) => {
//   const id = Number(req.params.id)
//   artworks = artworks.filter(artwork => artwork.id !== id)

//   res.status(204).end()
// })

const error = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

app.use(error)


const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})