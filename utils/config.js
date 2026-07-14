if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ override: true, quiet: true });
}

let PORT = process.env.PORT;
let MONGODB_URI = process.env.MONGODB_URI;
let SECRET = process.env.SECRET;
let TEST_SECRET = process.env.TEST_SECRET;

if (process.env.NODE_ENV === "test") {
  MONGODB_URI = process.env.TEST_MONGODB_URI;
  SECRET = process.env.TEST_SECRET;
}

module.exports = {
  MONGODB_URI,
  PORT,
  SECRET,
  TEST_SECRET,
};
