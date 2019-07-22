const jwt = require('jsonwebtoken')
//const config = require('./config')

//Gets the encoded token of the logged user
const getTokenFrom = request => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    console.log('authorizsubstring7',authorization.substring(7) )
    return authorization.substring(7)
  }
  return null
}

//Checks that the token is valid and not expired. Returns tokens contents
const authenticateToken = (req) => {
  const token = getTokenFrom(req)
  const decodedToken = jwt.verify(token, process.env.SECRET)

  if (!token || !decodedToken.id) {
    return req.status(401).json({ error: 'token missing or invalid' })
    // return null
  }
  console.log('check returntoken')
  return decodedToken
}


//Checks that the logged in user is accessing methods meant for him/her
const checkUser = (req, res, next) => {
  try {
    const token = authenticateToken(req)

    if (!token) {
      return res.status(401).json({ error: 'token missing or invalid' })
    }

    if (token.id.toString() !== req.params.id.toString()) {
      return res.status(401).json({ error: 'not authorized user' })
    }

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: error.message })
    } else {
      res.status(500).json({ error: error })
    }
  }
}
//Checks that the user is logged in
const checkLogin = (req, res, next) => {
  try {
    const token = authenticateToken(req)

    if (!token) {
      console.log('checklogin tokenmissing')
      return res.status(401).json({ error: 'token missing or invalid' })
    }

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.log('checklogin terror')
      res.status(401).json({ error: error.message })
    } else {
      console.log('checklogin terror')
      res.status(500).json({ error: error })
    }
  }
}

//Checks if the logged in user is an admin
const checkAdmin = (req, res, next) => {
  try {
    const token = authenticateToken(req)

    if (!token) {
      return res.status(401).json({ error: 'token missing or invalid' })
    }
    console.log('tokenrole', token.role)
    if (token.role !== 'admin') {
      return res.status(401).json({ error: 'not admin' })
    }

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: error.message })
    } else {
      res.status(500).json({ error: error })
    }
  }
}
module.exports = {
  checkLogin,
  checkAdmin,
  checkUser,
  getTokenFrom,
  authenticateToken
}