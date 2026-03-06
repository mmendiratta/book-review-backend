const mongoose = require("mongoose");

const bookReviewModelSchema = mongoose.Schema({
  author: { type: String, require: true },
  title: { type: String, require: true },
  review: { type: String, require: true },
  rating: { type: Number, require: true },
  url: { type: String },
  genre: { type: String },
  isbn: { type: String },
});

module.exports = mongoose.model("Book Review", bookReviewModelSchema);