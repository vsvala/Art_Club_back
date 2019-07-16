const mongoose = require('mongoose')


//schema tells to mongoose how to save objects
const eventSchema = new mongoose.Schema({
  eventImage:String,
  title:{ type:String, required:true },
  place: String,
  start: String,
  end: String,
  description: String,
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
  },
})

//Mongooses field: _id is object. Method toJSON changes it to string
eventSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})
const event= mongoose.model('Event', eventSchema)

module.exports = event
//module.exports = mongoose.model('Artwork', artworkSchema)