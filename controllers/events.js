const eventsRouter = require("express").Router();
const validateEvent = require("../utils/validators").validateEvent;
const { checkLogin, checkAdmin, authenticateToken } = require("../utils/checkRoute");
const eventService = require("../services/eventService");
const { upload, uploadToCloudinary, deleteFromCloudinary } = require("../utils/upload");

//gets all events
eventsRouter.get("/", checkLogin, async (req, res, next) => {
  try {
    const events = await eventService.getAllEvents();
    res.set("Cache-Control", "private, no-cache");
    res.json(events);
  } catch (error) {
    next(error);
  }
});

//posting events for admin
eventsRouter.post(
  "/",
  checkAdmin,
  upload.single("eventImage"),
  validateEvent,
  async (req, res, next) => {
    try {
      const token = authenticateToken(req);
      const event = await eventService.postEvent(req.body, token.id, req.file);
      res.status(200).json(event);
    } catch (error) {
      next(error);
    }
  },
);

//delete event for admin
eventsRouter.delete("/:id", checkAdmin, async (req, res, next) => {
  try {
    const event = await eventService.deleteEventById(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = eventsRouter;
