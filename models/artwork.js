const mongoose = require("mongoose");

//schema tells to mongoose how to save objects
const artworkSchema = new mongoose.Schema({
  galleryImage: { type: String, required: true },
  artist: { type: String, required: true },
  name: { type: String, required: true },
  year: { type: Number, required: true },
  size: { type: String, required: true },
  medium: { type: String, required: true },
  likes: { type: Number, default: 0 },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

//Mongooses field: _id is object. Method toJSON changes it to string
artworkSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});
const artwork = mongoose.model("Artwork", artworkSchema);

module.exports = artwork;
//module.exports = mongoose.model('Artwork', artworkSchema)
