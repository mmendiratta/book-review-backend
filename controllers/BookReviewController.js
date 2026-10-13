const BookReview = require("../models/BookReviewModel");

// Beli-style tiers: position in the ranked list (1 = favorite) maps to a star rating.
async function recomputeRatingsFromRank() {
  const ranked = await BookReview.find({ rank: { $ne: null } }).sort({ rank: 1 });
  const total = ranked.length;
  if (total === 0) return;

  const bulkOps = ranked.map((doc, index) => {
    const percentile = (index + 1) / total;
    let rating;
    if (percentile <= 0.1) rating = 5;
    else if (percentile <= 0.3) rating = 4;
    else if (percentile <= 0.7) rating = 3;
    else if (percentile <= 0.9) rating = 2;
    else rating = 1;

    return {
      updateOne: { filter: { _id: doc._id }, update: { rating } },
    };
  });

  await BookReview.bulkWrite(bulkOps);
}

exports.getRankedReviews = (req, res) => {
  BookReview.find({ rank: { $ne: null } })
    .sort({ rank: 1 })
    .then((reviews) => {
      res.status(200).json(reviews);
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
};

exports.setReviewRank = async (req, res) => {
  try {
    const requestedRank = Number(req.body.rank);
    const id = req.params.id;

    if (!Number.isInteger(requestedRank) || requestedRank < 1) {
      return res.status(400).json({ error: "rank must be a positive integer" });
    }

    const doc = await BookReview.findById(id);
    if (!doc) {
      return res.status(404).json({ error: "Book not found" });
    }

    const oldRank = doc.rank;
    if (oldRank != null) {
      // close the gap left behind by the book's previous position
      await BookReview.updateMany(
        { _id: { $ne: id }, rank: { $gt: oldRank } },
        { $inc: { rank: -1 } }
      );
    }

    const totalOtherRanked = await BookReview.countDocuments({
      _id: { $ne: id },
      rank: { $ne: null },
    });
    const clampedRank = Math.min(Math.max(1, requestedRank), totalOtherRanked + 1);

    // make room at the target position
    await BookReview.updateMany(
      { _id: { $ne: id }, rank: { $gte: clampedRank } },
      { $inc: { rank: 1 } }
    );

    doc.rank = clampedRank;
    await doc.save();
    await recomputeRatingsFromRank();

    res.status(200).json({ message: "Rank updated", rank: clampedRank });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

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
    : reviewBody.url
    ? reviewBody.url
    : reviewBody.isbn
    ? `https://covers.openlibrary.org/b/isbn/${reviewBody.isbn}-L.jpg`
    : '';

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
    const existingUrlIsIsbn = existingBook.url?.includes('covers.openlibrary.org');
    if (req.file) {
      coverUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
      console.log('Using uploaded image:', coverUrl);
    } else if (reviewBody.url) {
      // Explicit new cover URL (e.g. a fresh Thumbsnap upload from the frontend)
      coverUrl = reviewBody.url;
      console.log('Using provided URL:', coverUrl);
    } else if (reviewBody.isbn && (!existingBook.url || existingUrlIsIsbn)) {
      // Only use ISBN URL if no uploaded image is already set
      coverUrl = `https://covers.openlibrary.org/b/isbn/${reviewBody.isbn}-L.jpg`;
      console.log('Using ISBN cover:', coverUrl);
    } else {
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
