const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')
//const jwt = require('jsonwebtoken')
const { checkAdmin, authenticateToken, checkUser, checkLogin } = require('../utils/checkRoute')


// get all users, only for admin
usersRouter.get('/',checkAdmin, async (req, res) => {
  try {
    const users = await User.
      find({})
      .populate('artworks', { artist: 1, name: 1, year: 1, size: 1, medium: 1, galleryImage: 1  })
    //res.json(users.map(u => u.toJSON()))
    res.status(200).json(users)
  } catch (exception) {
    console.log(exception.message)
    res.status(400).json({ error: 'Could not get users from db' })
  }
})

// get all users/artist
usersRouter.get('/artists',async (req, res) => {
  try {
    const users = await User.
      find({})
      .populate('artworks', { artist: 1, name: 1, year: 1, size: 1, medium: 1, galleryImage: 1  })
    //res.json(users.map(u => u.toJSON()))
    res.status(200).json(users)
  } catch (exception) {
    console.log(exception.message)
    res.status(400).json({ error: 'Could not get artists from db' })
  }
})


//gets single  user with specific id for logged user
usersRouter.get('/admin/:id',checkUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('artworks')
    if(user){
      res.json(user.toJSON())}
    else{
      res.status(404).end()
    }
  }catch(exception){
    console.log(exception.message)
    res.status(400).json({ error: 'malformatted id, Could not get singleUser from db' })
  }
})

//gets single user with specific id for everybody
usersRouter.get('/artist/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('artworks')
    if(user){
      res.json(user.toJSON())}
    else{
      res.status(404).end()
    }
  }catch(exception){
    console.log(exception.message)
    res.status(400).json({ error: 'malformatted id, Could not get singleUser from db' })
  }
})


usersRouter.get('/mypage', checkLogin, async(req, res, next) => {

  try {
    const token = authenticateToken(req)
    console.log('token', token)
    const user = await User.findById(token.id)
    // const user = await User.findById(req.params.id)
      .populate('artworks')
    if(user){
      res.json(user.toJSON())}
    else{
      res.status(404).end()
    }
  }catch(error){
    next(error)//funktion next with parametr, moves error to errrorhandlingmiddleware
  }
})



//Creates user when registering
usersRouter.post('/', async (req, res) => {
  try {
    const body = req.body
    // check that username does not exist and password length is<8
    const existingUser = await User.find({ username: body.username })
    if (existingUser.length>0) {
      return res.status(400).json({ error: 'username must be unique' })
    }
    if (body.password.length<8) {
      return res.status(400).json({ error: 'password must have at least 8 letters' })
    }
    //console.log('bodypassword', body.password)
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)
    //console.log('passwordhash',  passwordHash)
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


//Updates user role, only for admin
usersRouter.put('/admin', checkAdmin, async (req, res) => {
  const body = req.body
  //console.log('body', body)
  //console.log('bodyId', body.role)
  try {
    let cUser= await User.findById(body.id)
    //console.log('cUser', cUser)
    await cUser.update({ role:req.body.role })
    res.json(cUser.toJSON())
    //console.log('updated', cUser)
  } catch (exception) {
    //console.log(exception)
    res.status(500).json({ error: 'did not update role, something went wrong...' })
  }
})


//Update password, for logged users
usersRouter.put('/password', checkLogin, async (req, res) => {
  //console.log('body',req.body)
  try {
    const body = req.body
    const token = authenticateToken(req)
    //console.log('token', token)
    const user = await User.findById(token.id)
    if( await bcrypt.compare(body.oldPassword, user.passwordHash)) {
      const saltRounds = 10
      const newPasswordHash = await bcrypt.hash(body.newPassword, saltRounds)
      await user.update({ passwordHash: newPasswordHash })
      //console.log('password updated')
      res.status(200).end()
    } else {
      console.log('old password does not match')
      res.status(400).json({ error: 'old password does not match' })
    }
  } catch (error) {
    console.log(error.message)
    res.status(400).json({ error: 'bad req' })
  }
})


//Updates user's introduction text with spesific id
usersRouter.put('/intro/:id', checkUser, async(req, res) => {
  const body = req.body
  console.log('body', body)
  try {
    let updatedUser= await User.findById(req.params.id)
    // console.log('uptadedUser', updatedUser)
    await updatedUser.update(
      { intro:req.body.intro
      })
    res.json(updatedUser.toJSON())
    // console.log('updated', updatedUser)
  } catch (exception) {
    console.log(exception)
    res.status(500).json({ error: 'did not update introduction, something went wrong...' })
  }
})


//Updates user information
usersRouter.put('/info/:id', checkUser, async(req, res) => {
  const body = req.body
  //console.log('body', body)
  console.log('bodyId', body.id)
  try {
    let updatedUser= await User.findById(body.id)
    //console.log('uptadedUser', updatedUser)
    await updatedUser.update(
      { name:req.body.name,
        email:req.body.email,
        username:req.body.username
      })
    res.json(updatedUser.toJSON())
    //console.log('updated', updatedUser)
  } catch (exception) {
    console.log(exception)
    res.status(500).json({ error: 'did not update information, something went wrong...' })
  }
})


// delete user, only for admin
usersRouter.delete('/:id', checkAdmin, async (req, res) => {
  try {
    await User.findByIdAndRemove(req.params.id)
    res.status(204).end()
  } catch (exception) {
    console.log(exception)
    res.status(400).json({ error: 'bad req' })
  }
})

module.exports = usersRouter
