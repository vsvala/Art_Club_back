const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const SALT_ROUNDS = 10;
const User = require("../models/user");
const {
  validateRegister,
  validateUserInfo,
  validatePassword,
  validateIntro,
} = require("../utils/validators");

const {
  checkAdmin,
  authenticateToken,
  checkUser,
  checkLogin,
} = require("../utils/checkRoute");
const { registerLimiter, passwordLimiter } = require("../utils/limiters");

// get all users, only for admin
usersRouter.get("/", checkAdmin, async (req, res, next) => {
  try {
    const users = await User.find({}).populate("artworks", {
      artist: 1,
      name: 1,
      year: 1,
      size: 1,
      medium: 1,
      galleryImage: 1,
    });
    res.status(200).json(users.map((u) => u.toJSON()));
  } catch (error) {
    next(error);
  }
});

// get all users/artist
usersRouter.get("/artists", async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("name intro artworks")
      .populate("artworks", {
        artist: 1,
        name: 1,
        year: 1,
        size: 1,
        medium: 1,
        galleryImage: 1,
      });
    res.json(users.map((u) => u.toJSON()));
  } catch (error) {
    next(error);
  }
});

//gets single  user with specific id for logged user
usersRouter.get("/admin/:id", checkUser, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("artworks");
    if (user) {
      res.json(user.toJSON());
    } else {
      res.status(404).json({
        error: "User not found",
      });
    }
  } catch (error) {
    next(error);
  }
});

//gets single user with specific id for everybody
usersRouter.get("/artist/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name intro artworks")
      .populate("artworks");
    if (user) {
      res.json(user.toJSON());
    } else {
      res.status(404).json({
        error: "User not found",
      });
    }
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/mypage", checkLogin, async (req, res, next) => {
  try {
    const token = authenticateToken(req);
    const user = await User.findById(token.id).populate("artworks");
    if (user) {
      res.json(user.toJSON());
    } else {
      res.status(404).end();
    }
  } catch (error) {
    next(error);
  }
});

//Creates user when registering
usersRouter.post(
  "/",
  registerLimiter,
  validateRegister,
  async (req, res, next) => {
    try {
      const body = req.body;
      // check that username does not exist
      const existingUser = await User.findOne({ username: body.username });
      if (existingUser) {
        return res.status(400).json({ error: "username must be unique" });
      }
      const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
      const user = new User({
        name: body.name,
        email: body.email,
        username: body.username,
        passwordHash,
        role: "nonMember", // ← important !!! backend asettaa aina itse, ei req.body.role ettei kukaan pääse hyökkäämään
      });
      const savedUser = await user.save();
      res.json(savedUser.toJSON());
    } catch (error) {
      next(error);
    }
  },
);

//Updates user role, only for admin
usersRouter.put("/admin", checkAdmin, async (req, res, next) => {
  const body = req.body;
  const allowedRoles = ["member", "nonMember", "admin"];
  if (!allowedRoles.includes(body.role)) {
    return res.status(400).json({ error: "invalid role" });
  }
  try {
    const updatedUser = await User.findByIdAndUpdate(
      body.id,
      {
        role: body.role,
      },
      { new: true, runValidators: true },
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "user not found" });
    }
    res.json(updatedUser.toJSON());
  } catch (error) {
    next(error);
  }
});

//Update password, for logged users
usersRouter.put(
  "/password",
  passwordLimiter,
  validatePassword,
  checkLogin,
  async (req, res, next) => {
    try {
      const body = req.body;
      const token = authenticateToken(req);
      const user = await User.findById(token.id);
      if (!user) {
        return res.status(404).json({ error: "user not found" });
      }
      if (await bcrypt.compare(body.oldPassword, user.passwordHash)) {
        const newPasswordHash = await bcrypt.hash(
          body.newPassword,
          SALT_ROUNDS,
        );
        user.passwordHash = newPasswordHash;
        await user.save();
        res.status(200).end();
      } else {
        res.status(400).json({ error: "old password does not match" });
      }
    } catch (error) {
      next(error);
    }
  },
);

//Updates user's introduction text with spesific id
usersRouter.put(
  "/intro/:id",
  checkUser,
  validateIntro,
  async (req, res, next) => {
    try {
      let updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { intro: req.body.intro },
        { new: true },
      );
      if (!updatedUser) {
        return res.status(404).json({ error: "user not found" });
      }
      res.json(updatedUser.toJSON());
    } catch (error) {
      next(error);
    }
  },
);

//Updates user information name, email, username
usersRouter.put(
  "/info/:id",
  checkUser,
  validateUserInfo,
  async (req, res, next) => {
    try {
      let updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          email: req.body.email,
          username: req.body.username,
        },
        { new: true },
      );
      if (!updatedUser) {
        return res.status(404).json({ error: "user not found" });
      }
      res.json(updatedUser.toJSON());
    } catch (error) {
      next(error);
    }
  },
);

// delete user, only for admin
usersRouter.delete("/:id", checkAdmin, async (req, res, next) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: "user not found" });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
module.exports = usersRouter;
