const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
//const jwt = require('jsonwebtoken')
const { checkAdmin, checkLogin } = require('../utils/checkRoute')


usersRouter.get('/',checkAdmin, async (req, res) => {
  try {
    const users = await User.
      find({})
      .populate('artworks', { artist: 1, name: 1, year: 1, size: 1, medium: 1, galleryImage: 1  })
    res.json(users.map(u => u.toJSON()))
    //res.status(200).json(users)
  } catch (exception) {
    console.log(exception.message)
    res.status(400).json({ error: 'Could not get studentlist from db' })
  }
})


//gets single  user with specific id
usersRouter.get('/:id',checkLogin, async (req, res, next) => {
  try{
    const user = await User.findById(req.params.id)
    if(user){
      res.json(user.toJSON())
    }else{
      res.status(404).end()
    }
  }catch(exception){
    next(exception)
  }
  // (error => {
  //   console.log(error)
  //   res.status(400).send({ error: 'malformatted id' })
  // })
})




usersRouter.post('/', async (req, res) => {
  try {
    const body = req.body

    // check that username does not exist
    // const existingUser = await User.find({ username: body.username })
    //   if (existingUser.length>0) {
    //     return res.status(400).json({ error: 'username must be unique' })
    //   }
    // if (body.password.length<8) {
    //   return res.status(400).json({ error: 'password must have at least 8 letters' })
    //}

    console.log('bodypassword', body.password)
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    console.log('passwordhash',  passwordHash)

    const user = new User({
      name: body.name,
      email: body.email,
      username: body.username,
      passwordHash,
      role:body.role
    })
    console.log('user',  user)
    const savedUser = await user.save()
    res.json(savedUser.toJSON())

  } catch (exception) {
    console.log(exception)
    res.status(500).json({ error: 'did not save user, something went wrong...' })
  }
})



usersRouter.delete('/:id', checkAdmin, async (req, res, next) => {
  try {
    await User.findByIdAndRemove(req.params.id)
    res.status(204).end()
  } catch (exception) {
    next(exception)
  }
})



usersRouter.get('/:id', (req, res, next) => {
  User.findById(req.params.id)
    .then(user => {
      if (user) {
        res.json(user.toJSON())
      } else {
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})
//funktion next with parametr, moves error to errrorhandlingmiddleware




/* //Updates user role
usersRouter.put('/:id', async (req, res) => {//checkUser
  const body = req.body
  console.log('body', body)

  try {
    let cUser= await User.findById(req.params.id)
    console.log('cUser', cUser)


    // const user = {
    //   name: cUser.name,
    //   email: cUser.email,
    //   username: cUser.username,
    //   role: body.role,
    //   artworks:
    //   cUser.artworks
    // }

    console.log('cusertaass',cUser)
    //console.log('user !!!!!!!!!!!!!!!!1', user)

    await cUser.update({ role:req.body.role })
    res.json(cUser.toJSON())
    console.log('updated')

  } catch (exception) {
    console.log(exception)
    res.status(500).json({ error: 'did not update user, something went wrong...' })
  }
}) */


//Updates user role
usersRouter.put('/admin', checkAdmin, async (req, res) => {
  const body = req.body
  console.log('body', body)
  console.log('bodyId', body.role)

  try {
    let cUser= await User.findById(body.id)
    console.log('cUser', cUser)

    await cUser.update({ role:req.body.role })
    res.json(cUser.toJSON())
    console.log('updated', cUser)

  } catch (exception) {
    console.log(exception)
    res.status(500).json({ error: 'did not update user, something went wrong...' })
  }
})

module.exports = usersRouter
