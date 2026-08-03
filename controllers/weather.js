const weatherRouter = require("express").Router();
const weatherService = require("../services/weatherService");

const MAX_CITY_LENGTH = 20;
const CITY_PATTERN = /^[\p{L}\s'.-]+$/u; // kirjaimet, välilyönti, piste, heittomerkki, väliviiva

weatherRouter.get("/", async (req, res, next) => {
  const city = req.query.city || "Helsinki";
  if (city.length > MAX_CITY_LENGTH || !CITY_PATTERN.test(city)) {
    return res.status(400).json({ error: "Invalid city parameter" });
  }
  try {
    const result = await weatherService.getWeatherForCity(city);
    res.set("Cache-Control", "public, max-age=300");
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = weatherRouter;
