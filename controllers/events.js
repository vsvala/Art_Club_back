const eventsRouter = require("express").Router();
const multer = require("multer");
const Event = require("../models/event");
const User = require("../models/user");
const logger = require("../utils/logger");
//const { authenticateToken } = require('../utils/checkRoute')
const { checkLogin, checkAdmin } = require("../utils/checkRoute");

//multer saves image to folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});
//rejects storing a file if not image
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/pdf" ||
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
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: fileFilter,
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

      const event = new Event({
        eventImage: req.file.path,
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
    const fs = require("fs");
    const filePath = "./" + event.eventImage;
    fs.access(filePath, (error) => {
      if (!error) {
        fs.unlinkSync(filePath);
      } else {
        logger.error(error.message);
      }
    });
    res.status(204).end();
  } catch (exception) {
    next(exception);
  }
});

module.exports = eventsRouter;
