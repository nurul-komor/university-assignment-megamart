const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
