const logger = require('./logger')

const requestLogger = (request, response, next) => {
  const start = Date.now()
  const body = { ...request.body }
  if (body.password) body.password = '***'

  response.on('finish', () => {
    const duration = Date.now() - start
    logger.info(`${request.method} ${request.path} ${response.statusCode} ${duration}ms`, body)
  })

  next()
}


const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, req, res, next) => {
  console.error(error.message)
  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  } else if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'invalid token' })
  }
  logger.error(error.message)

  next(error)
}


module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler
}