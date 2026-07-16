const artworksRouter = require("express").Router();
const { authenticateToken, checkLogin } = require("../utils/checkRoute");
const { upload } = require("../utils/upload");
const { validateArtwork } = require("../utils/validators");
const artworkService = require("../services/artworkService");
const NodeCache = require("node-cache");
const artworkCache = new NodeCache({ stdTTL: 300 }); // 5 min

artworksRouter.get("/", async (req, res, next) => {
  try {
    const cacheKey = `artworks:${JSON.stringify(req.query)}`;

    const cached = artworkCache.get(cacheKey);
    if (cached) {
      // console.log("Returning cached artworks data for", cacheKey);
      return res.status(200).json(cached);
    }
    const result = await artworkService.getArtworks(req.query);
    artworkCache.set(cacheKey, result);

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
