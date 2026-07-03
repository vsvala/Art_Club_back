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

  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await User.create({
    name: "Artist",
    email: "artist@example.com",
    username: "artist",
    passwordHash,
    role: "member",
  });

  const loginRes = await api
    .post("/api/login")
    .send({ username: "artist", password: "password123" });
  token = loginRes.body.token;

  await Artwork.create({
    name: "Test Artwork",
    artist: "Artist",
    year: 2024,
    size: "50x70 cm",
    medium: "Oil on canvas",
    likes: 0,
    galleryImage: "https://example.com/image.jpg",
    user: user._id,
  });
});

test("artworks are returned as JSON", async () => {
  await api
    .get("/api/artworks")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("correct number of artworks is returned", async () => {
  const res = await api.get("/api/artworks").expect(200);
  expect(res.body).toHaveLength(1);
});

test("single artwork is found by id", async () => {
  const artworks = await api.get("/api/artworks");
  const id = artworks.body[0].id;

  const res = await api.get(`/api/artworks/${id}`).expect(200);
  expect(res.body.name).toBe("Test Artwork");
});

test("artwork likes are updated", async () => {
  const artworks = await api.get("/api/artworks");
  const artwork = artworks.body[0];

  await api
    .put(`/api/artworks/${artwork.id}`)
    .send({ id: artwork.id, likes: 5 })
    .expect(200);
});

test("artwork is deleted by its owner", async () => {
  const artworks = await api.get("/api/artworks");
  const id = artworks.body[0].id;

  await api
    .delete(`/api/artworks/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);

  const after = await api.get("/api/artworks");
  expect(after.body).toHaveLength(0);
});

test("artwork deletion fails with another user's token", async () => {
  const passwordHash = await bcrypt.hash("password123", 10);
  await User.create({
    name: "Other",
    email: "other@example.com",
    username: "otheruser",
    passwordHash,
    role: "member",
  });
  const loginRes = await api
    .post("/api/login")
    .send({ username: "otheruser", password: "password123" });
  const otherToken = loginRes.body.token;

  const artworks = await api.get("/api/artworks");
  const id = artworks.body[0].id;

  await api
    .delete(`/api/artworks/${id}`)
    .set("Authorization", `Bearer ${otherToken}`)
    .expect(403);
});

test("artwork deletion fails without a token", async () => {
  const artworks = await api.get("/api/artworks");
  const id = artworks.body[0].id;

  await api.delete(`/api/artworks/${id}`).expect(401);
});

test("artwork is always created for the token user, not the client-supplied userId", async () => {
  const passwordHash = await bcrypt.hash("password123", 10);
  const otherUser = await User.create({
    name: "Other",
    email: "other@example.com",
    username: "otheruser",
    passwordHash,
    role: "member",
  });

  // Minimal valid PNG
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  );

  const res = await api
    .post("/api/artworks")
    .set("Authorization", `Bearer ${token}`)
    .field("userId", otherUser._id.toString())
    .field("name", "Test Artwork 2")
    .field("artist", "Artist")
    .field("year", "2024")
    .field("size", "50x70 cm")
    .field("medium", "Oil")
    .attach("galleryImage", pngBuffer, {
      filename: "test.png",
      contentType: "image/png",
    })
    .expect(200);

  // IDOR: artwork belongs to the token user, not the client-supplied userId
  expect(res.body.user).not.toBe(otherUser._id.toString());
});

afterAll(async () => {
  await mongoose.connection.close();
});
