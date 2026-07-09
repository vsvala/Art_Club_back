const logger = require("./logger");

const requestLogger = (request, response, next) => {
  const start = Date.now();
  const body = { ...request.body };
  if (body.password) body.password = "***";
  if (body.oldPassword) body.oldPassword = "***";
  if (body.newPassword) body.newPassword = "***";

  response.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(`${request.method} ${request.path} ${response.statusCode} ${duration}ms`, body);
  });

  next();
};

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, req, res, next) => {
  logger.error(error.message);
  if (error.name === "CastError" && error.kind === "ObjectId") {
    return res.status(400).json({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  } else if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "invalid token" });
  } else if (error.name === "TokenExpiredError") {
    return res.status(401).json({ error: "token expired" });
  } else if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "file too large" });
  } else if (error.status) {
    return res.status(error.status).json({ error: error.message });
  }

  res.status(500).json({ error: "internal server error" });
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
};
