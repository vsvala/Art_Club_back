const config = require("./utils/config");
const Sentry = require("@sentry/node");
const express = require("express");
const path = require("path");
const app = express();
// Render sits in front of the app as a single reverse proxy, so the first
// hop's X-Forwarded-For is trustworthy for rate-limiting/IP lookups.
app.set("trust proxy", 1);
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { loginLimiter, apiLimiter } = require("./utils/limiters");

//Routers
const usersRouter = require("./controllers/users");
const loginRouter = require("./controllers/login");
const eventsRouter = require("./controllers/events");
const artworksRouter = require("./controllers/artworks");
const weatherRouter = require("./controllers/weather");

const middleware = require("./utils/middleware.js");
const logger = require("./utils/logger");
const tokenCheckRouter = require("./controllers/tokenCheck");

const { buildConnectSrc } = require("./utils/csp");
const defaultCspDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();

const connectSrc = buildConnectSrc(
  [
    process.env.SENTRY_DSN,
    process.env.SENTRY_BROWSER_DSN,
    process.env.VITE_SENTRY_DSN,
    process.env.REACT_APP_SENTRY_DSN,
    process.env.NEXT_PUBLIC_SENTRY_DSN,
  ],
  defaultCspDirectives["connect-src"],
);

//sync indexes for artwork and user models
// mongoose.connect(config.MONGODB_URI).then(async () => {
//   logger.info("connected to MongoDB");
//   if (process.env.NODE_ENV !== "test") {
//     await Promise.all([
//       require("./models/artwork").syncIndexes(),
//       require("./models/user").syncIndexes(),
//     ]);
//     logger.info("indexes synced");
//   }
// });

logger.info("connecting to MongoDB...");
mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info("connected to MongoDB");
  })
  .catch((error) => {
    logger.error("error connection to MongoDB:", error.message);
  });

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...defaultCspDirectives,
        "connect-src": connectSrc,
        "img-src": ["'self'", "data:", "res.cloudinary.com"],
      },
    },
  }),
);
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? false // same origin back end serves build, no CORS needed
        : "http://localhost:3000", // dev
  }),
);
app.use(express.json());
app.use(middleware.requestLogger);
app.use(express.static("build"));
app.use("/uploads", express.static("uploads")); //create a static path reference to folder
app.use("/public/uploads", express.static("uploads"));

const apiUrl = "/api";
app.use(`${apiUrl}/users`, apiLimiter, usersRouter);
app.use(`${apiUrl}/artworks`, apiLimiter, artworksRouter);
app.use(`${apiUrl}/events`, apiLimiter, eventsRouter);
app.use(`${apiUrl}/weather`,apiLimiter, weatherRouter);

if (process.env.NODE_ENV === "test") {
  app.use(`${apiUrl}/login`, loginRouter);
} else {
  app.use(`${apiUrl}/login`, loginLimiter, loginRouter);
}
app.use(`${apiUrl}/tokenCheck`, tokenCheckRouter);

if (process.env.NODE_ENV === "test") {
  const testingRouter = require("./controllers/testing");
  app.use(`${apiUrl}/testing`, testingRouter);
}


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

Sentry.setupExpressErrorHandler(app);
app.use(middleware.errorHandler);

module.exports = app;
