const config = require("./utils/config");
const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { loginLimiter } = require("./utils/limiters");

//Routrers
const usersRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");
const eventsRouter = require("./controllers/events");
const artworksRouter = require("./controllers/artworks");
const middleware = require("./utils/middleware.js");
const logger = require("./utils/logger");
const tokenCheckRouter = require("./controllers/tokenCheck");

logger.info("connecting to MongoDB...");
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
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "res.cloudinary.com"],
      },
    },
  }),
);
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? false // same origin, no CORS needed
        : "http://localhost:3000", // dev
  }),
);
app.use(express.json());
app.use(middleware.requestLogger);
app.use(express.static("build"));
app.use("/uploads", express.static("uploads")); //create a static path reference to folder
app.use("/public/uploads", express.static("uploads"));

const apiUrl = "/api";
app.use(`${apiUrl}/users`, usersRouter);
app.use(`${apiUrl}/artworks`, artworksRouter);
app.use(`${apiUrl}/events`, eventsRouter);
app.use(`${apiUrl}/login`, loginLimiter, loginRouter);
app.use(`${apiUrl}/tokenCheck`, tokenCheckRouter);

if (process.env.NODE_ENV === "test") {
  const testingRouter = require("./controllers/testing");
  app.use(`${apiUrl}/testing`, testingRouter);
}

app.get("/api/weather", async (req, res) => {
  const city = req.query.city || "Helsinki";

  try {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`,
    );
    const geoData = await geo.json();

    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({ error: `City "${city}" not found` });
    }
    const place = geoData.results[0];
    // console.log("place.latitude", place.latitude);
    // console.log("place.longitude", place.longitude);

    const weather = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&timezone=auto`,
    );
    const weatherData = await weather.json();

    if (
      !weatherData.current ||
      weatherData.current.temperature_2m === undefined
    ) {
      logger.error("Weather data missing current field:", JSON.stringify(weatherData));
      return res.status(502).json({ error: "Weather data unavailable" });
    }

    res.json({
      city: place.name,
      country: place.country,
      temperature: weatherData.current.temperature_2m,
      weather_code: weatherData.current.weather_code,
    });
  } catch (error) {
    logger.error("Weather error:", error.message);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 1 = connected, anything else = not ready
  if (dbState !== 1) {
    return res.status(503).json({ status: "error", db: "disconnected" });
  }
  res.status(200).json({
    status: "ok",
    db: "connected",
    uptime: Math.floor(process.uptime()),
  });
});

// Serve React app for all non-API routes so browser refresh works on any path
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.use(middleware.unknownEndpoint);

app.use(middleware.errorHandler);

module.exports = app;
