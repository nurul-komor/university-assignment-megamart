const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const { apiRouter } = require("./modules/api");
const { errorHandler, notFoundHandler } = require("./shared/middlewares");

const app = express();

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
  const disconnectedStates = [mongoose.STATES.disconnected, mongoose.STATES.disconnecting];
  const state = mongoose.connection.readyState;

  if (disconnectedStates.includes(state)) {
    return res.status(503).json({ status: "disconnected" });
  }

  try {
    await mongoose.connection.db.admin().ping();
    return res.json({ status: "connected" });
  } catch (_error) {
    return res.status(503).json({ status: "disconnected" });
  }
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
