const mongoose = require('mongoose')


//schema tells to mongoose how to save objects
const artworkSchema = new mongoose.Schema({
  galleryImage:String,//{ type:String, required:true },
  artist: String,
  name: String,
  year: Number,
  size: String,
  medium: String,
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
})


//Mongooses field: _id is object. Method toJSON changes it to string
artworkSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})
const artwork = mongoose.model('Artwork', artworkSchema)

module.exports = artwork
//module.exports = mongoose.model('Artwork', artworkSchema)