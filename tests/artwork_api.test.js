const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);

let uniqueCounter = 0;

const uniqueValue = (prefix) => `${prefix}_${Date.now()}_${uniqueCounter++}`;

const createUserAndToken = async ({
  role = "member",
  name = "Artist",
} = {}) => {
  const username = uniqueValue(role === "admin" ? "adminuser" : "artist");
  const createRes = await api.post("/api/testing/users").send({
    name,
    email: `${username}@example.com`,
    username,
    password: "password123",
    role,
  });

  const loginRes = await api
    .post("/api/login")
    .send({ username, password: "password123" });

  return { user: createRes.body, token: loginRes.body.token };
};

const createBaseFixture = async () => {
  await api.post("/api/testing/reset").expect(204);

  const { user, token } = await createUserAndToken({
    role: "member",
    name: "Artist",
  });
  const artworkRes = await api.post("/api/testing/artworks").send({
    name: "Test Artwork",
    artist: "Artist",
    year: 2024,
    size: "50x70 cm",
    medium: "Oil on canvas",
    likes: 0,
    galleryImage: "https://example.com/image.jpg",
    user: user.id,
  });

  return {
    token,
    userId: user.id,
    artworkId: artworkRes.body.id,
  };
};

test("artworks are returned as JSON", async () => {
  await createBaseFixture();
  await api
    .get("/api/artworks")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("correct number of artworks is returned", async () => {
  await createBaseFixture();
  const res = await api.get("/api/artworks").expect(200);
  expect(res.body.artworks).toHaveLength(1);
});

test("single artwork is found by id", async () => {
  const { artworkId } = await createBaseFixture();

  const res = await api.get(`/api/artworks/${artworkId}`).expect(200);
  expect(res.body.name).toBe("Test Artwork");
});

test("artwork likes are updated", async () => {
  const { token, artworkId } = await createBaseFixture();

  await api
    .put(`/api/artworks/${artworkId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ id: artworkId, likes: 5 })
    .expect(200);
});

test("artwork likes update fails without a token", async () => {
  const { artworkId } = await createBaseFixture();

  await api
    .put(`/api/artworks/${artworkId}`)
    .send({ id: artworkId, likes: 5 })
    .expect(401);
});

test("artwork is deleted by its owner", async () => {
  const { token, artworkId } = await createBaseFixture();

  await api
    .delete(`/api/artworks/${artworkId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect(204);

  const after = await api.get("/api/artworks");
  expect(after.body.artworks).toHaveLength(0);
});

test("artwork deletion fails with another user's token", async () => {
  const { artworkId } = await createBaseFixture();

  const username = uniqueValue("otheruser");
  await api.post("/api/testing/users").send({
    name: "Other",
    email: `${username}@example.com`,
    username,
    password: "password123",
    role: "member",
  });
  const loginRes = await api
    .post("/api/login")
    .send({ username, password: "password123" });
  const otherToken = loginRes.body.token;

  await api
    .delete(`/api/artworks/${artworkId}`)
    .set("Authorization", `Bearer ${otherToken}`)
    .expect(403);
});

test("artwork is deleted by admin even when not owner", async () => {
  const { artworkId } = await createBaseFixture();
  const { token: adminToken } = await createUserAndToken({
    role: "admin",
    name: "Admin",
  });

  await api
    .delete(`/api/artworks/${artworkId}`)
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(204);

  const after = await api.get("/api/artworks");
  expect(after.body.artworks).toHaveLength(0);
});

test("artwork deletion fails without a token", async () => {
  const { artworkId } = await createBaseFixture();

  await api.delete(`/api/artworks/${artworkId}`).expect(401);
});

test("artwork is always created for the token user, not the client-supplied userId", async () => {
  const { token } = await createBaseFixture();

  const username = uniqueValue("otheruser");
  const otherUserRes = await api.post("/api/testing/users").send({
    name: "Other",
    email: `${username}@example.com`,
    username,
    password: "password123",
    role: "member",
  });
  const otherUser = otherUserRes.body;

  // Minimal valid PNG
  const pngBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  );

  const res = await api
    .post("/api/artworks")
    .set("Authorization", `Bearer ${token}`)
    .field("userId", otherUser.id)
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
  expect(res.body.user).not.toBe(otherUser.id);
});

describe("pagination", () => {
  const TOTAL = 15;
  const LIMIT = 5;
  let paginationUserId;

  beforeEach(async () => {
    await api.post("/api/testing/reset").expect(204);

    const { user } = await createUserAndToken({
      role: "member",
      name: "Artist",
    });
    paginationUserId = user.id;

    await Promise.all(
      Array.from({ length: TOTAL }, (_, i) =>
        api.post("/api/testing/artworks").send({
          name: `Artwork ${i + 1}`,
          artist: "Artist",
          year: 2024,
          size: "50x70 cm",
          medium: "Oil on canvas",
          likes: 0,
          galleryImage: "https://example.com/image.jpg",
          user: paginationUserId,
        }),
      ),
    );
  });

  test("first page returns correct.artworks and hasMore=true", async () => {
    const res = await api
      .get(`/api/artworks?page=1&limit=${LIMIT}`)
      .expect(200);
    expect(res.body.artworks).toHaveLength(LIMIT);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(LIMIT);
    expect(res.body.hasMore).toBe(true);
  });

  test("middle page returns correct.artworks and hasMore=true", async () => {
    const res = await api
      .get(`/api/artworks?page=2&limit=${LIMIT}`)
      .expect(200);
    expect(res.body.artworks).toHaveLength(LIMIT);
    expect(res.body.page).toBe(2);
    expect(res.body.hasMore).toBe(true);
  });

  test("last page returns remaining.artworks and hasMore=false", async () => {
    const res = await api
      .get(`/api/artworks?page=3&limit=${LIMIT}`)
      .expect(200);
    expect(res.body.artworks).toHaveLength(TOTAL - LIMIT * 2);
    expect(res.body.page).toBe(3);
    expect(res.body.hasMore).toBe(false);
  });

  test("empty collection returns empty.artworks and hasMore=false", async () => {
    await api.post("/api/testing/reset").expect(204);
    const res = await api.get("/api/artworks?page=1&limit=5").expect(200);
    expect(res.body.artworks).toHaveLength(0);
    expect(res.body.hasMore).toBe(false);
  });
});
