const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  dataCollection: {
    // Configure privacy defaults by uncommenting these lines if needed.
    // userInfo: false,
    // httpBodies: [],
  },
});
