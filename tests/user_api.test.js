const supertest = require("supertest");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/user");
const Artwork = require("../models/artwork");

const api = supertest(app);

beforeEach(async () => {
  await Artwork.deleteMany({});
  await User.deleteMany({});
  const passwordHash = await bcrypt.hash("password123", 10);
  await User.create({
    name: "Test User",
    email: "test@example.com",
    username: "testuser",
    passwordHash,
    role: "member",
  });

  const passwordHashAdmin = await bcrypt.hash("password123", 10);
  const userAdmin = await User.create({
    name: "AdminUser",
    email: "admin@example.com",
    username: "admin",
    passwordHash: passwordHashAdmin,
    role: "admin",
  });

  const loginRes = await api
    .post("/api/login")
    .send({ username: "admin", password: "password123" });
  token = loginRes.body.token;
  adminId = userAdmin.id;

  const passwordHashNoMMember = await bcrypt.hash("password123", 10);
  const userNoMember = await User.create({
    name: "NoMemberUser",
    email: "nomember@example.com",
    username: "nomember",
    passwordHash: passwordHashNoMMember,
    role: "admin",
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

test("member role is changed by admin", async () => {
  const users = await api.get("/api/users/artists");
  const userId = users.body[2].id;

  const res = await api
    .put(`/api/users/admin`)
    .set("Authorization", `Bearer ${token}`)
    .send({ id: userId, role: "member" })
    .expect(200);

  expect(res.body.role).toBe("member");
});

test("user intro can't be created without a token", async () => {
  const users = await api.get("/api/users/artists");
  const userId = users.body[0].id;

  const res = await api
    .put(`/api/users/intro/${userId}`)
    .send({ intro: "Hello, I am a test user!" })
    .expect(401);

  expect(res.body.error).toBeDefined();
});

test("user intro can be created", async () => {
  const res = await api
    .put(`/api/users/intro/${adminId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ intro: "Hello, I am a test user!" })
    .expect(200);

  expect(res.body.intro).toBe("Hello, I am a test user!");
});

test("user intro can be updated", async () => {
  await api
    .put(`/api/users/intro/${adminId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ intro: "Original intro" });

  const res = await api
    .put(`/api/users/intro/${adminId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ intro: "Updated intro" })
    .expect(200);

  expect(res.body.intro).toBe("Updated intro");
});

test("admin can get all users", async () => {
  const res = await api.get("/api/users").set("Authorization", `Bearer ${token}`).expect(200);

  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
});

test("non-admin cannot get all users", async () => {
  const loginRes = await api
    .post("/api/login")
    .send({ username: "testuser", password: "password123" });
  const userToken = loginRes.body.token;

  await api.get("/api/users").set("Authorization", `Bearer ${userToken}`).expect(403);
});

test("logged-in user can get own profile from mypage", async () => {
  const loginRes = await api
    .post("/api/login")
    .send({ username: "testuser", password: "password123" });
  const userToken = loginRes.body.token;

  const res = await api
    .get("/api/users/mypage")
    .set("Authorization", `Bearer ${userToken}`)
    .expect(200);

  expect(res.body.username).toBe("testuser");
  expect(res.body.email).toBeDefined();
});

test("mypage fails without token", async () => {
  await api.get("/api/users/mypage").expect(401);
});

test("password change succeeds with correct old password", async () => {
  const loginRes = await api
    .post("/api/login")
    .send({ username: "testuser", password: "password123" });
  const userToken = loginRes.body.token;

  await api
    .put("/api/users/password")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ oldPassword: "password123", newPassword: "newpassword123" })
    .expect(200);
});

test("password change fails with wrong old password", async () => {
  const loginRes = await api
    .post("/api/login")
    .send({ username: "testuser", password: "password123" });
  const userToken = loginRes.body.token;

  await api
    .put("/api/users/password")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ oldPassword: "wrongpassword", newPassword: "newpassword123" })
    .expect(400);
});

test("user can update their own info", async () => {
  const loginRes = await api
    .post("/api/login")
    .send({ username: "testuser", password: "password123" });
  const userToken = loginRes.body.token;

  const artists = await api.get("/api/users/artists");
  const userId = artists.body.find((u) => u.name === "Test User").id;

  const res = await api
    .put(`/api/users/info/${userId}`)
    .set("Authorization", `Bearer ${userToken}`)
    .send({ name: "Updated Name", email: "updated@example.com", username: "testuser" })
    .expect(200);

  expect(res.body.name).toBe("Updated Name");
  expect(res.body.email).toBe("updated@example.com");
});

test("admin can delete a user", async () => {
  const artists = await api.get("/api/users/artists");
  const userId = artists.body.find((u) => u.name === "Test User").id;

  await api.delete(`/api/users/${userId}`).set("Authorization", `Bearer ${token}`).expect(204);
});

test("non-admin cannot delete a user", async () => {
  const loginRes = await api
    .post("/api/login")
    .send({ username: "testuser", password: "password123" });
  const userToken = loginRes.body.token;

  const artists = await api.get("/api/users/artists");
  const userId = artists.body.find((u) => u.name === "Test User").id;

  await api.delete(`/api/users/${userId}`).set("Authorization", `Bearer ${userToken}`).expect(403);
});

afterAll(async () => {
  await mongoose.connection.close();
});

//npm test -- tests/user_api.test.js
