const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);

const geoResponse = () => ({
  results: [
    {
      name: "Helsinki",
      country: "Finland",
      latitude: 60.16952,
      longitude: 24.93545,
    },
  ],
});

const forecastResponse = () => ({
  current: {
    temperature_2m: 18.4,
    weather_code: 3,
  },
});

const mockFetchSequence = (...responses) => {
  const fetchSpy = jest.spyOn(global, "fetch");
  responses.forEach((body) => {
    fetchSpy.mockImplementationOnce(async () => ({
      json: async () => body,
    }));
  });
  return fetchSpy;
};

afterEach(() => {
  jest.restoreAllMocks();
});

test("returns weather data as JSON for a known city", async () => {
  mockFetchSequence(geoResponse(), forecastResponse());

  const response = await api
    .get("/api/weather?city=Helsinki")
    .expect(200)
    .expect("Content-Type", /application\/json/);

  expect(response.body).toEqual({
    city: "Helsinki",
    country: "Finland",
    temperature: 18.4,
    weather_code: 3,
  });
});

test("defaults to Helsinki when no city query param is given", async () => {
  const fetchSpy = mockFetchSequence(geoResponse(), forecastResponse());

  await api.get("/api/weather").expect(200);

  expect(fetchSpy.mock.calls[0][0]).toContain("name=Helsinki");
});

test("returns 404 when the city is not found", async () => {
  mockFetchSequence({ results: [] });

  const response = await api
    .get("/api/weather?city=InvalidCity")
    .expect(404)
    .expect("Content-Type", /application\/json/);

  expect(response.body).toEqual({ error: 'City "InvalidCity" not found' });
});

test("returns 502 when the forecast response has no current data", async () => {
  mockFetchSequence(geoResponse(), { current: null });

  const response = await api
    .get("/api/weather?city=Helsinki")
    .expect(502)
    .expect("Content-Type", /application\/json/);

  expect(response.body).toEqual({ error: "Weather data unavailable" });
});

test("returns 500 when the upstream request fails", async () => {
  jest.spyOn(global, "fetch").mockRejectedValueOnce(new Error("network down"));

  const response = await api
    .get("/api/weather?city=Helsinki")
    .expect(500)
    .expect("Content-Type", /application\/json/);

  expect(response.body).toEqual({ error: "Failed to fetch weather data" });
});
