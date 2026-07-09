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

  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await User.create({
    name: "Artist",
    email: "artist@example.com",
    username: "artist",
    passwordHash,
    role: "admin",
  });

  const loginRes = await api
    .post("/api/login")
    .send({ username: "artist", password: "password123" });
  token = loginRes.body.token;

  await Event.create({
    title: "Test Event",
    place: "Test Place",
    start: new Date(),
    end: new Date(),
    description: "Test description",
    user: user._id,
  });
});

test("events are returned as JSON", async () => {
  await api
    .get("/api/events")
    .set("Authorization", `Bearer ${token}`)
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("correct number of events is returned", async () => {
  const res = await api.get("/api/events").set("Authorization", `Bearer ${token}`).expect(200);
  expect(res.body).toHaveLength(1);
});

test("event is deleted by logged-in admin", async () => {
  const events = await api.get("/api/events").set("Authorization", `Bearer ${token}`);
  const id = events.body[0].id;

  await api.delete(`/api/events/${id}`).set("Authorization", `Bearer ${token}`).expect(204);

  const after = await api.get("/api/events").set("Authorization", `Bearer ${token}`);
  expect(after.body).toHaveLength(0);
});

test("event deletion fails with a non-admin token", async () => {
  const passwordHash = await bcrypt.hash("password123", 10);
  await User.create({
    name: "Member",
    email: "member@example.com",
    username: "member",
    passwordHash,
    role: "member",
  });
  const loginRes = await api
    .post("/api/login")
    .send({ username: "member", password: "password123" });
  const memberToken = loginRes.body.token;

  const events = await api.get("/api/events").set("Authorization", `Bearer ${token}`);
  const id = events.body[0].id;

  await api.delete(`/api/events/${id}`).set("Authorization", `Bearer ${memberToken}`).expect(403);
});

test("event deletion fails without a token", async () => {
  const events = await api.get("/api/events").set("Authorization", `Bearer ${token}`);
  const id = events.body[0].id;

  await api.delete(`/api/events/${id}`).expect(401);
});
