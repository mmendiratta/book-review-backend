const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const bookReviewRoutes = require("./routes/BookReviewRoutes");
const userRoutes = require("./routes/UserRoutes");
const path = require("path");

const app = express();

const dbName = process.env.MONGO_DB_NAME ? `/${process.env.MONGO_DB_NAME}` : "";

mongoose
  .connect(
    `mongodb+srv://book-review-user:${process.env.PASSWORD}@book-review-cluster1.xm8potp.mongodb.net${dbName}?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log(`connected to mongodb atlas${dbName ? ` (db: ${process.env.MONGO_DB_NAME})` : ""}`);
  })
  .catch((error) => {
    console.log("unable to connect to mondodb");
    console.error(error);
  });

app.use("", (_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/api/book-reviews", bookReviewRoutes);
app.use("/api/auth", userRoutes);

module.exports = app;
