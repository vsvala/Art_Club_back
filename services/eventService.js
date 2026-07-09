const User = require("../models/user");
const Event = require("../models/event");
const logger = require("../utils/logger");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/upload");

const getAllEvents = async () => {
  const events = await Event.find({}).populate("user", {
    username: 1,
    name: 1,
  });
  return events.map((event) => event.toJSON());
};

const postEvent = async (eventData, id, file) => {
  const { title, place, start, end, description } = eventData;
  const user = await User.findById(id);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  if (!file) {
    const err = new Error("No file uploaded");
    err.status = 400;
    throw err;
  }
  const imageUrl =
    process.env.NODE_ENV === "test"
      ? "https://placehold.co/100x100.png"
      : await uploadToCloudinary(file.buffer, file.mimetype);
  const event = new Event({
    eventImage: imageUrl,
    title,
    place,
    start,
    end,
    description,
    user,
  });
  const savedEvent = await event.save();
  return savedEvent.toJSON();
};
const deleteEventById = async (id) => {
  const event = await Event.findByIdAndDelete(id);
  if (!event) {
    const err = new Error("Event not found");
    err.status = 404;
    throw err;
  }
  if (event.eventImage) {
    try {
      await deleteFromCloudinary(event.eventImage);
    } catch (cloudinaryError) {
      logger.error(`Cloudinary delete failed: ${cloudinaryError.message}`);
    }
  }
  return event.toJSON();
};
module.exports = {
  getAllEvents,
  deleteEventById,
  postEvent,
};
