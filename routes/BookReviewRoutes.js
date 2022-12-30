const express = require("express");

const router = express.Router();
const bookReviewController = require("../controllers/BookReviewController");

const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");

router.get("/", bookReviewController.getAllReviews);
router.get("/:id", bookReviewController.getReviewById);

router.post("/", bookReviewController.createBookReview);

router.put("/:id", bookReviewController.updateBookreview);
router.delete("/:id", bookReviewController.deleteBookReview);

module.exports = router;
