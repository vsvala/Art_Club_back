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

app.get("/api/weather", async (req, res) => {
  const city = req.query.city || "Helsinki";

  try {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json`,
      // `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
    );
    const geoData = await geo.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ error: `City "${city}" not found` });
    }

    const place = geoData.results[0];

    // console.log("place.latitude", place.latitude);
    // console.log("place.longitude", place.longitude);

    const weather = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m`,
    );
    const weatherData = await weather.json();
    //console.log("weatherdata", weatherData);

    res.json({
      city: place.name,
      country: place.country,
      temperature: weatherData.current.temperature_2m,
    });
  } catch (error) {
    console.error("Weather error:", error);
    res.status(500).json({
      error: "Failed to fetch weather data",
      error: error.message,
      stack: error.stack,
    });
  }
});

// Serve React app for all non-API routes so browser refresh works on any path
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
