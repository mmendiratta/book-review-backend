const BookReview = require("../models/BookReviewModel");

exports.getAllReviews = (req, res) => {
  BookReview.find()
    .sort({ _id: -1 })
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
  const coverUrl = req.file
    ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    : reviewBody.isbn
    ? `https://covers.openlibrary.org/b/isbn/${reviewBody.isbn}-L.jpg`
    : reviewBody.url || '';

  const bookReview = new BookReview({
    author: reviewBody.author,
    title: reviewBody.title,
    review: reviewBody.review,
    rating: reviewBody.rating,
    url: coverUrl,
    genre: reviewBody.genre,
    isbn: reviewBody.isbn
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

exports.updateBookreview = async (req, res) => {
  try {
    const reviewBody = req.body;
    console.log('Update request body:', reviewBody);
    console.log('Update request file:', req.file);

    // Get existing book to preserve URL if not updating
    const existingBook = await BookReview.findById(req.params.id);
    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Determine cover URL with proper fallback
    let coverUrl;
    if (req.file) {
      // New image uploaded
      coverUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
      console.log('Using uploaded image:', coverUrl);
    } else if (reviewBody.isbn) {
      // ISBN provided, use Open Library
      coverUrl = `https://covers.openlibrary.org/b/isbn/${reviewBody.isbn}-L.jpg`;
      console.log('Using ISBN cover:', coverUrl);
    } else {
      // Preserve existing URL
      coverUrl = existingBook.url;
      console.log('Preserving existing URL:', coverUrl);
    }

    const updatedReview = {
      author: reviewBody.author,
      title: reviewBody.title,
      review: reviewBody.review,
      rating: reviewBody.rating,
      url: coverUrl,
      genre: reviewBody.genre || existingBook.genre,
      isbn: reviewBody.isbn || existingBook.isbn
    };

    await BookReview.updateOne({ _id: req.params.id }, updatedReview);
    console.log('Successfully updated book:', req.params.id);
    res.status(200).json({ message: "Updated Review!" });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};
