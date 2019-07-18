const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user')



loginRouter.post('/', async (req, res) => {
  const body = req.body

  try {
    const user = await User.findOne({ username: body.username })
    const passwordCorrect = user === null
      ? false
      : await bcrypt.compare(body.password, user.passwordHash)

    if (!(user && passwordCorrect)) {
      return res.status(401).json({
        error: 'invalid username or password'
      })
    }

    const userForToken = {
      username: user.username,
      id: user._id,
      role:user.role
    }

    const token = jwt.sign(userForToken, process.env.SECRET)

    res
      .status(200)
      .send({ token, username: user.username, name: user.name, role: user.role, id:user.id, email:user.email, intro:user.intro })
  }
  catch (error) {
    console.log(error.message)
    return res.status(500).json({ error: 'authentication error' })
  }

})

module.exports = loginRouter