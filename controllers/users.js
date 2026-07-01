const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const User = require("../models/user");
const logger = require("../utils/logger");
const {
  checkAdmin,
  authenticateToken,
  checkUser,
  checkLogin,
} = require("../utils/checkRoute");

// get all users, only for admin
usersRouter.get("/", checkAdmin, async (req, res) => {
  try {
    const users = await User.find({}).populate("artworks", {
      artist: 1,
      name: 1,
      year: 1,
      size: 1,
      medium: 1,
      galleryImage: 1,
    });
    //res.json(users.map(u => u.toJSON()))
    res.status(200).json(users);
  } catch (exception) {
    logger.error(exception.message);
    res.status(400).json({ error: "Could not get users from db" });
  }
});

// get all users/artist
usersRouter.get("/artists", async (req, res) => {
  try {
    const users = await User.find({}).populate("artworks", {
      artist: 1,
      name: 1,
      year: 1,
      size: 1,
      medium: 1,
      galleryImage: 1,
    });
    //res.json(users.map(u => u.toJSON()))
    res.status(200).json(users);
  } catch (exception) {
    logger.error(exception.message);
    res.status(400).json({ error: "Could not get artists from db" });
  }
});

//gets single  user with specific id for logged user
usersRouter.get("/admin/:id", checkUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("artworks");
    if (user) {
      res.json(user.toJSON());
    } else {
      res.status(404).end();
    }
  } catch (exception) {
    logger.error(exception.message);
    res
      .status(400)
      .json({ error: "malformatted id, Could not get singleUser from db" });
  }
});

//gets single user with specific id for everybody
usersRouter.get("/artist/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("artworks");
    if (user) {
      res.json(user.toJSON());
    } else {
      res.status(404).end();
    }
  } catch (exception) {
    logger.error(exception.message);
    res
      .status(400)
      .json({ error: "malformatted id, Could not get singleUser from db" });
  }
});

usersRouter.get("/mypage", checkLogin, async (req, res, next) => {
  try {
    const token = authenticateToken(req);
    const user = await User.findById(token.id)
      // const user = await User.findById(req.params.id)
      .populate("artworks");
    if (user) {
      res.json(user.toJSON());
    } else {
      res.status(404).end();
    }
  } catch (error) {
    next(error); //funktion next with parametr, moves error to errrorhandlingmiddleware
  }
});

//Creates user when registering
usersRouter.post("/", async (req, res) => {
  try {
    const body = req.body;
    // check that username does not exist and password length is<8
    const existingUser = await User.find({ username: body.username });
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "username must be unique" });
    }
    if (body.password.length < 8) {
      return res
        .status(400)
        .json({ error: "password must have at least 8 letters" });
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(body.password, saltRounds);
    const user = new User({
      name: body.name,
      email: body.email,
      username: body.username,
      passwordHash,
      role: "nonMember", // // ← important !!! backend asettaa aina itse, ei req.body.role ettei kukaan pääse hyökkäämään
    });
    const savedUser = await user.save();
    res.json(savedUser.toJSON());
  } catch (exception) {
    logger.error(exception.message);
    res
      .status(500)
      .json({ error: "did not save user, something went wrong..." });
  }
});

//Updates user role, only for admin
usersRouter.put("/admin", checkAdmin, async (req, res) => {
  const body = req.body;
  const allowedRoles = ["member", "nonMember", "admin"];
  if (!allowedRoles.includes(body.role)) {
    return res.status(400).json({ error: "invalid role" });
  }
  try {
    const updatedUser = await User.findByIdAndUpdate(body._id, {
      role: body.role,
    });
    if (!updatedUser) {
      return res.status(404).json({ error: "user not found" });
    }
    res.json(updatedUser.toJSON());
  } catch (exception) {
    res
      .status(500)
      .json({ error: "did not update role, something went wrong..." });
  }
});

//Update password, for logged users
usersRouter.put("/password", checkLogin, async (req, res) => {
  try {
    const body = req.body;
    const token = authenticateToken(req);
    const user = await User.findById(token.id);
    if (await bcrypt.compare(body.oldPassword, user.passwordHash)) {
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(body.newPassword, saltRounds);
      user.passwordHash = newPasswordHash;
      await user.save();
      res.status(200).end();
    } else {
      res.status(400).json({ error: "old password does not match" });
    }
  } catch (error) {
    logger.error(error.message);
    res.status(400).json({ error: "bad req" });
  }
});

//Updates user's introduction text with spesific id
usersRouter.put("/intro/:id", checkUser, async (req, res) => {
  try {
    let updatedUser = await User.findById(req.params.id);
    await User.findByIdAndUpdate(req.params.id, { intro: req.body.intro });
    res.json(updatedUser.toJSON());
  } catch (exception) {
    logger.error(exception.message);
    res
      .status(500)
      .json({ error: "did not update introduction, something went wrong..." });
  }
});

//Updates user information
usersRouter.put("/info/:id", checkUser, async (req, res) => {
  const body = req.body;
  try {
    let updatedUser = await User.findById(body.id);
    await User.findByIdAndUpdate(body.id, {
      name: req.body.name,
      email: req.body.email,
      username: req.body.username,
    });
    res.json(updatedUser.toJSON());
  } catch (exception) {
    logger.error(exception.message);
    res
      .status(500)
      .json({ error: "did not update information, something went wrong..." });
  }
});

// delete user, only for admin
usersRouter.delete("/:id", checkAdmin, async (req, res) => {
  try {
    await User.findByIdAndRemove(req.params.id);
    res.status(204).end();
  } catch (exception) {
    logger.error(exception.message);
    res.status(400).json({ error: "bad req" });
  }
});
module.exports = usersRouter;
