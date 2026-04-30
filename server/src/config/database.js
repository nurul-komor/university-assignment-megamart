const mongoose = require("mongoose");
const { env } = require("./env");

let connectPromise = null;

async function connectDatabase() {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is required.");
  }

  if (mongoose.connection.readyState === mongoose.STATES.connected) {
    return mongoose.connection;
  }

  if (!connectPromise) {
    connectPromise = mongoose.connect(env.mongodbUri).catch((error) => {
      connectPromise = null;
      throw error;
    });
  }

  await connectPromise;
  return mongoose.connection;
}

module.exports = { connectDatabase };
