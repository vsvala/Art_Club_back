const mongoose = require('mongoose')


// data type is a Buffer, allows us to store our image as data in the form of arrays
const imageSchema = new mongoose.Schema({
  imageName:{
    type:String,
    default:'none',
    required:true
  },
  galleryImage: {
    type:String,
    required:true
  }
})

imageSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})
const Image =mongoose.model('Image', imageSchema)

module.exports=Image
//module.export =  mongoose.model('Image', imageSchema)

/* image:{
    data: Buffer,
    contentType:String
  }*/
