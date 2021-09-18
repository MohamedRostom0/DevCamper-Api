const express = require("express");

const Review = require("../models/Review");

const advancedResults = require("../middleware/advancedResults");
const { protect, auth, authorize } = require("../middleware/auth");

const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviews");

const router = express.Router({ mergeParams: true }); // accept routing from other routers
// const router = express.Router();

router
  .route("/")
  .get(
    advancedResults(Review, { path: "bootcamp", select: "name description" }),
    getReviews
  )
  .post(protect, authorize("user", "admin"), createReview);

router
  .route("/:id")
  .get(getReview)
  .put(protect, authorize("user", "admin"), updateReview)
  .delete(protect, authorize("user", "admin"), deleteReview);

module.exports = router;
