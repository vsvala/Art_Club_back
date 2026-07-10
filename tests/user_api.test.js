const supertest = require("supertest");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/user");

const api = supertest(app);

beforeEach(async () => {
  await User.deleteMany({});
  const passwordHash = await bcrypt.hash("password123", 10);
  await User.create({
    name: "Test User",
    email: "test@example.com",
    username: "testuser",
    passwordHash,
    role: "member",
  });
});

// --- User creation ---

test("new user is created successfully", async () => {
  const newUser = {
    name: "New User",
    email: "new@example.com",
    username: "newuser",
    password: "password123",
    role: "member",
  };
  const res = await api
    .post("/api/users")
    .send(newUser)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  expect(res.body.username).toBe("newuser");
  expect(res.body.passwordHash).toBeUndefined();
});

test("user creation fails if username is already taken", async () => {
  const duplicate = {
    name: "Another",
    email: "another@example.com",
    username: "testuser",
    password: "password123",
  };
  const res = await api.post("/api/users").send(duplicate).expect(400);

  expect(res.body.error).toContain("unique");
});

test("user creation fails with a password shorter than 8 characters", async () => {
  const res = await api
    .post("/api/users")
    .send({
      name: "X",
      email: "x@x.com",
      username: "xuser",
      password: "short",
    })
    .expect(400);

  expect(res.body.error).toContain("8");
});

// --- Login ---

test("login succeeds with correct credentials", async () => {
  const res = await api
    .post("/api/login")
    .send({ username: "testuser", password: "password123" })
    .expect(200);

  expect(res.body.token).toBeDefined();
  expect(res.body.username).toBe("testuser");
});

test("login fails with wrong password", async () => {
  const res = await api
    .post("/api/login")
    .send({ username: "testuser", password: "wrong" })
    .expect(401);

  expect(res.body.error).toContain("invalid");
});

test("login fails without username", async () => {
  await api.post("/api/login").send({ password: "password123" }).expect(400);
});

// --- Password change ---

test("password change fails if new password is shorter than 8 characters", async () => {
  const loginRes = await api
    .post("/api/login")
    .send({ username: "testuser", password: "password123" });
  const userToken = loginRes.body.token;

  const res = await api
    .put("/api/users/password")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ oldPassword: "password123", newPassword: "short" })
    .expect(400);

  expect(res.body.error).toContain("8");
});

// --- Public fields ---

test("public artist list does not expose email or role", async () => {
  const res = await api.get("/api/users/artists").expect(200);
  res.body.forEach((user) => {
    expect(user.email).toBeUndefined();
    expect(user.role).toBeUndefined();
  });
});

test("public single artist does not expose email or role", async () => {
  const artists = await api.get("/api/users/artists");
  const artistId = artists.body[0].id;

  const res = await api.get(`/api/users/artist/${artistId}`).expect(200);
  expect(res.body.email).toBeUndefined();
  expect(res.body.role).toBeUndefined();
});

afterAll(async () => {
  await mongoose.connection.close();
});
