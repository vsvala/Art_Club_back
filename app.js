const config = require("./utils/config");
const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

//Routrers
const usersRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");
const eventsRouter = require("./controllers/events");
const artworksRouter = require("./controllers/artworks");
const middleware = require("./utils/middleware.js");
const logger = require("./utils/logger");
const tokenCheckRouter = require("./controllers/tokenCheck");

logger.info("connecting to", config.MONGODB_URI);

// connecting to db throught config file
//console.log('commecting to', config.MONGODB_URI)

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    //console.log('connected to MongoDB')
    logger.info("connected to MongoDB");
  })
  .catch((error) => {
    //console.log('error connection to MongoDB:', error.message)
    logger.error("error connection to MongoDB:", error.message);
  });

// Middlewares
app.use(cors());
app.use(express.json());
app.use(middleware.requestLogger);
app.use(express.static("build"));
app.use("/uploads", express.static("uploads")); //create a static path reference to folder
app.use("/public/uploads", express.static("uploads"));

const apiUrl = "/api";
app.use(`${apiUrl}/users`, usersRouter);
app.use(`${apiUrl}/artworks`, artworksRouter);
app.use(`${apiUrl}/events`, eventsRouter);
app.use(`${apiUrl}/login`, loginRouter);
app.use(`${apiUrl}/tokenCheck`, tokenCheckRouter);

// Serve React app for all non-API routes so browser refresh works on any path
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
