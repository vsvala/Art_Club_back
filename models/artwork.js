const mongoose = require('mongoose')

const url = process.env.MONGODB_URI

console.log('connecting to', url)

mongoose.connect(url, { useNewUrlParser: true })
  .then(result => {
    console.log('connected to MongoDB', result)
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

//schema tells to mongoose how to save objects
const artworkSchema = new mongoose.Schema({
  image: String,
  artist: String,
  name: String,
  date: Date,
  size: String,
  medium: String,
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  }
})


//Mongooses field: _id is object. Method toJSON changes it to string
artworkSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Artwork', artworkSchema)