const config = require('./utils/config')
const app = require('./app') // varsinainen Express-sovellus
const http = require('http')


const server = http.createServer(app)


server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`)
})