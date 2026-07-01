const eventsRouter = require("express").Router();
const multer = require("multer");
const Event = require("../models/event");
const User = require("../models/user");
const logger = require("../utils/logger");
const { cloud_name, api_key, api_secret } = require("../utils/config");
const cloudinary = require("cloudinary").v2;
const { checkLogin, checkAdmin } = require("../utils/checkRoute");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//rejects storing a file if not image
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf" ||
    file.mimetype === "image/gif"
  ) {
    cb(null, true);
  } else {
    logger.error(`Rejected file upload: unsupported mimetype ${file.mimetype}`);
    cb(null, false);
  }
};
//filesize limitations
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: fileFilter,
});

const uploadToCloudinary = (buffer, mimetype) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "artclub" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });

//gets all events
eventsRouter.get("/", checkLogin, async (req, res) => {
  try {
    const events = await Event.find({}).populate("user", {
      username: 1,
      name: 1,
    });
    res.json(events.map((event) => event.toJSON()));
  } catch (exception) {
    console.log(exception.message);
    res.status(400).json({ error: "Could not get eventList from db" });
  }
});

//posting events for admin
eventsRouter.post(
  "/",
  checkAdmin,
  upload.single("eventImage"),
  async (req, res) => {
    const body = req.body;
    try {
      const user = await User.findById(body.userId);
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const imageUrl = await uploadToCloudinary(
        req.file.buffer,
        req.file.mimetype,
      );
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
      res.status(200).json(savedEvent);
    } catch (error) {
      logger.error(error.message);
      res.status(400).json({ error: "bad req" });
    }
  },
);

//delete event for admin
eventsRouter.delete("/:id", checkAdmin, async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "artwork not found" });
    }
    if (event.eventImage) {
      try {
        const publicId = event.eventImage.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`artclub/${publicId}`);
      } catch (cloudinaryError) {
        logger.error(`Cloudinary delete failed: ${cloudinaryError.message}`);
      }
    }
    res.status(204).end();
  } catch (exception) {
    next(exception);
  }
});

module.exports = eventsRouter;
