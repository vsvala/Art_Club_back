const logger = require("./logger");
const SENTRY_FALLBACK_ORIGINS = ["https://*.ingest.sentry.io", "https://*.ingest.de.sentry.io"];

const buildConnectSrc = (dsnCandidates, defaultConnectSrc = ["'self'"]) => {
  const sentryIngestOrigins = [];
  for (const dsn of dsnCandidates.filter(Boolean)) {
    try {
      const origin = new URL(dsn).origin;
      if (!sentryIngestOrigins.includes(origin)) {
        sentryIngestOrigins.push(origin);
      }
    } catch (error) {
      logger.warn("Invalid Sentry DSN in env, skipping CSP origin", error.message);
    }
  }

  const origins = sentryIngestOrigins.length > 0 ? sentryIngestOrigins : SENTRY_FALLBACK_ORIGINS;

  const connectSrc = [...defaultConnectSrc];
  for (const origin of origins) {
    if (!connectSrc.includes(origin)) {
      connectSrc.push(origin);
    }
  }
  return connectSrc;
};
module.exports = { buildConnectSrc };
