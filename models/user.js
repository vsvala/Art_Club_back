const mongoose =require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')


const userSchema =mongoose.Schema({
  name:String,
  email:String,
  username:
  {
    type:String,
    unique:true
  },
  passwordHash:
  { type:String,
    required:true
  },
  role:String,

  intro:String,

  artworks:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'Artwork'
    }
  ],
}
)
userSchema.plugin(uniqueValidator)

// userSchema.statics.format = (user) => {
//   return {
//     id: user.id,
//     username: user.username,
//     name: user.name,
//     artworks:user.artworks
//   }
// }

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash //filter passwordHasoh to invisible
  }
})


const User =mongoose.model('User', userSchema)

module.exports=User