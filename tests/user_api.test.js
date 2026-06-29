//- Käyttäjän luominen onnistuu
// - Duplikaattikäyttäjänimi hylätään (400)
// - Liian lyhyt salasana hylätään (400)
// - Kirjautuminen onnistuu oikeilla tunnuksilla → token palautuu
// - Kirjautuminen epäonnistuu väärällä salasanalla (401)
// - Kirjautuminen ilman käyttäjänimeä (400)

const mongoose = require("mongoose");
const supertest = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../app");
const User = require("../models/user");

const api = supertest(app);

beforeEach(async () => {
  await User.deleteMany({});
  const passwordHash = await bcrypt.hash("salasana123", 10);
  await User.create({
    name: "Testi Käyttäjä",
    email: "testi@example.com",
    username: "testikayttaja",
    passwordHash,
    role: "member",
  });
});

// --- Käyttäjän luominen ---

test("uusi käyttäjä luodaan onnistuneesti", async () => {
  const newUser = {
    name: "Uusi Käyttäjä",
    email: "uusi@example.com",
    username: "uusikayttaja",
    password: "salasana123",
    role: "member",
  };
  const res = await api
    .post("/api/users")
    .send(newUser)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  expect(res.body.username).toBe("uusikayttaja");
  expect(res.body.passwordHash).toBeUndefined(); // salasana ei palaudu
});

test("käyttäjän luonti epäonnistuu jos käyttäjänimi on jo käytössä", async () => {
  const duplicate = {
    name: "Toinen",
    email: "toinen@example.com",
    username: "testikayttaja", // sama kuin beforeEach:ssä
    password: "salasana123",
  };
  const res = await api.post("/api/users").send(duplicate).expect(400);

  expect(res.body.error).toContain("unique");
});

test("käyttäjän luonti epäonnistuu liian lyhyellä salasanalla", async () => {
  const res = await api
    .post("/api/users")
    .send({
      name: "X",
      email: "x@x.com",
      username: "xkayttaja",
      password: "lyhyt",
    })
    .expect(400);

  expect(res.body.error).toContain("8");
});

// --- Kirjautuminen ---

test("kirjautuminen onnistuu oikeilla tunnuksilla", async () => {
  const res = await api
    .post("/api/login")
    .send({ username: "testikayttaja", password: "salasana123" })
    .expect(200);

  expect(res.body.token).toBeDefined();
  expect(res.body.username).toBe("testikayttaja");
});

test("kirjautuminen epäonnistuu väärällä salasanalla", async () => {
  const res = await api
    .post("/api/login")
    .send({ username: "testikayttaja", password: "väärä" })
    .expect(401);

  expect(res.body.error).toContain("invalid");
});

test("kirjautuminen epäonnistuu ilman käyttäjänimeä", async () => {
  await api.post("/api/login").send({ password: "salasana123" }).expect(400);
});

afterAll(async () => {
  await mongoose.connection.close();
});
