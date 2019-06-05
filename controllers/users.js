const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')




usersRouter.get('/', async (req, res) => {
  const users = await User.find({})
  res.json(users.map(u => u.toJSON()))
})


usersRouter.post('/', async (req, res) => {
  try {
    const body = req.body

    // check that username does not exist
    const existingUser = await User.find({ username: body.username })
    if (existingUser.length>0) {
      return res.status(400).json({ error: 'username must be unique' })
    }

    if (body.password.length<8) {
      return res.status(400).json({ error: 'password must have at least 8 letters' })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const user = new User({
      username: body.username,
      name: body.name,
      passwordHash,
      role:'nonmember'
    })

    const savedUser = await user.save()

    res.json(savedUser)
  } catch (exception) {
    console.log(exception)
    res.status(500).json({ error: 'did not save user, something went wrong...' })
  }
})




module.exports = usersRouter
