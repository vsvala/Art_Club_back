const eventsRouter = require("express").Router();
const Event = require("../models/event");
const User = require("../models/user");
const logger = require("../utils/logger");
const {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/upload");
const {
  checkLogin,
  checkAdmin,
  authenticateToken,
} = require("../utils/checkRoute");

//gets all events
eventsRouter.get("/", checkLogin, async (req, res, next) => {
  try {
    const events = await Event.find({}).populate("user", {
      username: 1,
      name: 1,
    });
    res.json(events.map((event) => event.toJSON()));
  } catch (error) {
    next(error);
  }
});

//posting events for admin
eventsRouter.post(
  "/",
  checkAdmin,
  upload.single("eventImage"),
  async (req, res, next) => {
    try {
      const token = authenticateToken(req);
      const user = await User.findById(token.id);
      if (!user) return res.status(404).json({ error: "user not found" });
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const imageUrl =
        process.env.NODE_ENV === "test"
          ? "https://placehold.co/100x100.png"
          : await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      const event = new Event({
        eventImage: imageUrl,
        title: req.body.title,
        place: req.body.place,
        start: req.body.start,
        end: req.body.end,
        description: req.body.description,
        user: user,
      });
      const savedEvent = await event.save();
      res.status(200).json(savedEvent.toJSON());
    } catch (error) {
      next(error);
    }
  },
);

//delete event for admin
eventsRouter.delete("/:id", checkAdmin, async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    if (event.eventImage) {
      try {
        await deleteFromCloudinary(event.eventImage);
      } catch (cloudinaryError) {
        logger.error(`Cloudinary delete failed: ${cloudinaryError.message}`);
      }
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = eventsRouter;
