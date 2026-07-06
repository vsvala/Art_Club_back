const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
  dataCollection: {
    // Configure privacy defaults by uncommenting these lines if needed.
    // userInfo: false,
    // httpBodies: [],
  },
});
