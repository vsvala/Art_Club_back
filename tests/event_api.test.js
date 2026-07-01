const mongoose = require("mongoose");
const supertest = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../app");
const User = require("../models/user");
const Event = require("../models/event");

const api = supertest(app);

let token;

beforeEach(async () => {
  await Event.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash("salasana123", 10);
  const user = await User.create({
    name: "Taiteilija",
    email: "taiteilija@example.com",
    username: "taiteilija",
    passwordHash,
    role: "admin",
  });

  const loginRes = await api
    .post("/api/login")
    .send({ username: "taiteilija", password: "salasana123" });
  token = loginRes.body.token;

  // Luo testitapahtuma suoraan tietokantaan (ei kuvalatausta)
  await Event.create({
    title: "Testitapahtuma",
    place: "Testipaikka",
    start: new Date(),
    end: new Date(),
    description: "Testikuvaus",
    user: user._id,
  });
});

test("tapahtumat palautetaan JSON-muodossa", async () => {
  await api
    .get("/api/events")
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("tapahtumia on oikea määrä", async () => {
  const res = await api
    .get("/api/events")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  expect(res.body).toHaveLength(1);
});

test("tapahtuma poistetaan kirjautuneena käyttäjänä", async () => {
  const events = await api
    .get("/api/events")
    .set("Authorization", `Bearer ${token}`);
  const id = events.body[0].id;

  await api
    .delete(`/api/events/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);

  const after = await api
    .get("/api/events")
    .set("Authorization", `Bearer ${token}`);
  expect(after.body).toHaveLength(0);
});

test("tapahtuman poisto epäonnistuu toisen käyttäjän tokenilla", async () => {
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

  // Yritä poistaa ensimmäisen käyttäjän tapahtuma
  const events = await api
    .get("/api/events")
    .set("Authorization", `Bearer ${otherToken}`);

  const id = events.body[0].id;

  await api
    .delete(`/api/events/${id}`)
    .set("Authorization", `Bearer ${otherToken}`)
    .expect(403);
});

test("tapahtuman poisto epäonnistuu ilman tokenia", async () => {
  const events = await api
    .get("/api/events")
    .set("Authorization", `Bearer ${token}`);
  const id = events.body[0].id;

  await api.delete(`/api/events/${id}`).expect(401);
});

afterAll(async () => {
  await mongoose.connection.close();
});
