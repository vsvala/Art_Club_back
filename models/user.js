const mongoose =require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')


const userSchema =mongoose.Schema({
  username:{
    type:String,
    unique:true
  },
  name:String,
  passwordHash: String,
  role:String,
  artworks:[
    {
      type:mongoose.Schema.Types.ObjectId,
      artworksref:'Artwork'
    }
  ],
})
userSchema.plugin(uniqueValidator)


userSchema.set('toJSON', {
  transform:(document, returnedObject) => {
    returnedObject.object.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject._v
    // filter passwordHasoh to invisible
    delete returnedObject.passwordHash
  }
})


const User =mongoose.model('User', userSchema)

module.exports=User