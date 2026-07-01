const mongoose = require("mongoose");
const supertest = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../app");
const User = require("../models/user");
const Artwork = require("../models/artwork");

const api = supertest(app);

let token;

beforeEach(async () => {
  await Artwork.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash("salasana123", 10);
  const user = await User.create({
    name: "Taiteilija",
    email: "taiteilija@example.com",
    username: "taiteilija",
    passwordHash,
    role: "member",
  });

  const loginRes = await api
    .post("/api/login")
    .send({ username: "taiteilija", password: "salasana123" });
  token = loginRes.body.token;

  // Luo testiteos suoraan tietokantaan (ei kuvalatausta)
  await Artwork.create({
    name: "Testiteos",
    artist: "Taiteilija",
    year: 2024,
    size: "50x70 cm",
    medium: "Öljy kankaalle",
    likes: 0,
    galleryImage: "https://example.com/kuva.jpg",
    user: user._id,
  });
});

test("taideteokset palautetaan JSON-muodossa", async () => {
  await api
    .get("/api/artworks")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("taideteoksia on oikea määrä", async () => {
  const res = await api.get("/api/artworks").expect(200);
  expect(res.body).toHaveLength(1);
});

test("yksittäinen taideteos löytyy id:llä", async () => {
  const artworks = await api.get("/api/artworks");
  const id = artworks.body[0].id;

  const res = await api.get(`/api/artworks/${id}`).expect(200);
  expect(res.body.name).toBe("Testiteos");
});

test("taideteoksen tykkäykset päivittyvät", async () => {
  const artworks = await api.get("/api/artworks");
  const artwork = artworks.body[0];

  await api
    .put(`/api/artworks/${artwork.id}`)
    .send({ id: artwork.id, likes: 5 })
    .expect(200);
});

test("taideteos poistetaan kirjautuneena käyttäjänä", async () => {
  const artworks = await api.get("/api/artworks");
  const id = artworks.body[0].id;

  await api
    .delete(`/api/artworks/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);

  const after = await api.get("/api/artworks");
  expect(after.body).toHaveLength(0);
});

test("taideteoksen poisto epäonnistuu toisen käyttäjän tokenilla", async () => {
  // Luo toinen käyttäjä ja kirjaudu sillä
  const passwordHash = await bcrypt.hash("salasana123", 10);
  await User.create({
    name: "Toinen",
    email: "toinen@example.com",
    username: "toinenkayttaja",
    passwordHash,
    role: "member",
  });
  const loginRes = await api
    .post("/api/login")
    .send({ username: "toinenkayttaja", password: "salasana123" });
  const otherToken = loginRes.body.token;

  // Yritä poistaa ensimmäisen käyttäjän teos
  const artworks = await api.get("/api/artworks");
  const id = artworks.body[0].id;

  await api
    .delete(`/api/artworks/${id}`)
    .set("Authorization", `Bearer ${otherToken}`)
    .expect(403);
});

test("taideteoksen poisto epäonnistuu ilman tokenia", async () => {
  const artworks = await api.get("/api/artworks");
  const id = artworks.body[0].id;

  await api.delete(`/api/artworks/${id}`).expect(401);
});

afterAll(async () => {
  await mongoose.connection.close();
});
