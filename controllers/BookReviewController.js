const BookReview = require("../models/BookReviewModel");

exports.getAllReviews = (req, res) => {
  BookReview.find()
    .then((reviews) => {
      res.status(200).json(reviews);
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
};

exports.getReviewById = (req, res) => {
  BookReview.findOne({
    _id: req.params.id,
  })
    .then((review) => {
      res.status(200).json(review);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.createBookReview = (req, res) => {
  const reviewBody = req.body;
  const bookReview = new BookReview({
    author: reviewBody.author,
    title: reviewBody.title,
    review: reviewBody.review,
    rating: reviewBody.rating,
    url: reviewBody.url
  });

  bookReview
    .save()
    .then(() => {
      res.status(201).json({ message: "successful creation of review" });
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
};

exports.deleteBookReview = (req, res) => {
  BookReview.findOne({ _id: req.params.id }).then(() => {
    BookReview.deleteOne({ _id: req.params.id })
      .then(() => {
        res.status(200).json({
          message: "Review deleted!",
        });
      })
      .catch((error) => {
        res.status(400).json({
          error: error,
        });
      });
  });
};

exports.updateBookreview = (req, res) => {
  const reviewBody = req.body;
  updatedReview = new BookReview({
    _id: req.params.id,
    author: reviewBody.author,
    title: reviewBody.title,
    review: reviewBody.review,
    rating: reviewBody.rating,
    url: reviewBody.url
  });
  BookReview.updateOne({ _id: req.params.id }, updatedReview)
    .then(() => {
      res.status(200).json({ message: "Updated Review!" });
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
};
