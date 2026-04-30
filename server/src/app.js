const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { connectDatabase } = require("./config/database");
const { apiRouter } = require("./modules/api");
const { errorHandler, notFoundHandler } = require("./shared/middlewares");

const app = express();

function getConnectionStateLabel(state) {
  const labels = {
    [mongoose.STATES.disconnected]: "disconnected",
    [mongoose.STATES.connected]: "connected",
    [mongoose.STATES.connecting]: "connecting",
    [mongoose.STATES.disconnecting]: "disconnecting",
  };
  return labels[state] || "unknown";
}

function resolveDisconnectReason(error, state) {
  const message = String(error?.message || "").toLowerCase();

  if (!process.env.MONGODB_URI) return "missing_mongodb_uri";
  if (message.includes("authentication failed")) return "mongodb_authentication_failed";
  if (message.includes("mngodb_uri is required") || message.includes("mongodb_uri is required")) {
    return "missing_mongodb_uri";
  }
  if (
    message.includes("enotfound") ||
    message.includes("eai_again") ||
    message.includes("timed out") ||
    message.includes("server selection timed out")
  ) {
    return "mongodb_network_unreachable";
  }
  if (state === mongoose.STATES.connecting) return "mongodb_still_connecting";
  if (state === mongoose.STATES.disconnecting) return "mongodb_disconnect_in_progress";
  if (state === mongoose.STATES.disconnected) return "mongodb_disconnected";
  return "mongodb_ping_failed";
}

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/health/db", async (_req, res) => {
  try {
    await connectDatabase();
    await mongoose.connection.db.admin().ping();
    return res.json({
      status: "connected",
      state: getConnectionStateLabel(mongoose.connection.readyState),
    });
  } catch (error) {
    const state = mongoose.connection.readyState;
    return res.status(503).json({
      status: "disconnected",
      state: getConnectionStateLabel(state),
      reason: resolveDisconnectReason(error, state),
      message: error?.message || "Unknown database error",
    });
  }
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
