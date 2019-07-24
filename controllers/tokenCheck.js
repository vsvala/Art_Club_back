const tokenCheckRouter = require('express').Router()
const checkLogin = require('../utils/checkRoute').checkLogin

//Returns status 200 ok if user is logged in
tokenCheckRouter.get('/', checkLogin, (req, res) => {
  console.log('router')
  res.status(200).json({ message: 'success' })
})

module.exports = tokenCheckRouter