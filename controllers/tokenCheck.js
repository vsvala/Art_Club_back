const tokenCheckRouter = require('express').Router()
const checkLogin = require('../utils/checkRoute').checkLogin


//Returns status 200 ok if user is logged in
tokenCheckRouter.get('/', checkLogin, (req, res) => {
  console.log('router')
  res.status(200).json({ message: 'success' })
})

// heroku reload page fix
tokenCheckRouter.get('/*', async(req, res) => {
  await res.sendFile('./build/index.html')
})

module.exports = tokenCheckRouter