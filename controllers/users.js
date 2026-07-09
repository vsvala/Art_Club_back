const usersRouter = require("express").Router();
const {
  validateRegister,
  validateUserInfo,
  validatePassword,
  validateIntro,
} = require("../utils/validators");
const { checkAdmin, authenticateToken, checkUser, checkLogin } = require("../utils/checkRoute");
const { registerLimiter, passwordLimiter } = require("../utils/limiters");
const userService = require("../services/userService");

// get all users, only for admin
usersRouter.get("/", checkAdmin, async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

// get all users/artist
usersRouter.get("/artists", async (req, res, next) => {
  try {
    const users = await userService.getAllArtists();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

//gets single  user with specific id for logged user
usersRouter.get("/admin/:id", checkUser, async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

//gets single user with specific id for everybody
usersRouter.get("/artist/:id", async (req, res, next) => {
  try {
    const user = await userService.getSingleArtistById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

usersRouter.get("/mypage", checkLogin, async (req, res, next) => {
  try {
    const token = authenticateToken(req);
    const user = await userService.getUserById(token.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

//Registering user, default role is nonMember, only admin can change role
usersRouter.post("/", registerLimiter, validateRegister, async (req, res, next) => {
  try {
    const user = await userService.registerUser(req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

//Updates user role, only for admin
usersRouter.put("/admin", checkAdmin, async (req, res, next) => {
  try {
    const updatedUser = await userService.updateUserRole(req.body);
    res.json(updatedUser);
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
      const token = authenticateToken(req);
      await userService.changePassword({ userId: token.id, ...req.body });
      res.status(200).end();
    } catch (error) {
      next(error);
    }
  },
);

//Updates user's introduction text with spesific id
usersRouter.put("/intro/:id", checkUser, validateIntro, async (req, res, next) => {
  try {
    let updatedUser = await userService.updateUserIntro({
      userId: req.params.id,
      intro: req.body.intro,
    });
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

//Updates user information name, email, username
usersRouter.put("/info/:id", checkUser, validateUserInfo, async (req, res, next) => {
  try {
    let updatedUser = await userService.updateUserInfo({
      userId: req.params.id,
      ...req.body,
    });
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// delete user, only for admin
usersRouter.delete("/:id", checkAdmin, async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = usersRouter;
