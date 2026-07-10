const artworksRouter = require("express").Router();
const { authenticateToken, checkLogin } = require("../utils/checkRoute");
const { upload } = require("../utils/upload");
const { validateArtwork } = require("../utils/validators");
const artworkService = require("../services/artworkService");

artworksRouter.get("/", async (req, res, next) => {
  try {
    const result = await artworkService.getArtworks(req.query);
    res.set("Cache-Control", "public, max-age=300"); // 5min
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

artworksRouter.get("/:id", async (req, res, next) => {
  try {
    const artwork = await artworkService.getArtworkById(req.params.id);
    res.set("Cache-Control", "public, max-age=300");
    res.status(200).json(artwork);
  } catch (error) {
    next(error);
  }
});

artworksRouter.post(
  "/",
  checkLogin,
  upload.single("galleryImage"),
  validateArtwork,
  async (req, res, next) => {
    try {
      const token = authenticateToken(req);
      const artwork = await artworkService.createArtwork({
        body: req.body,
        file: req.file,
        userId: token.id,
      });
      res.status(200).json(artwork);
    } catch (error) {
      next(error);
    }
  },
);

artworksRouter.delete("/:id", checkLogin, async (req, res, next) => {
  try {
    const token = authenticateToken(req);
    await artworkService.deleteArtwork({
      artworkId: req.params.id,
      userId: token.id,
      role: token.role,
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

artworksRouter.put("/:id", checkLogin, async (req, res, next) => {
  try {
    const artwork = await artworkService.updateArtworkLikes({
      artworkId: req.params.id,
      likes: req.body.likes,
    });
    res.json(artwork);
  } catch (error) {
    next(error);
  }
});

module.exports = artworksRouter;
