const Bootcamp = require("../models/Bootcamp");
const Review = require("../models/Review");
const ErrorResponce = require("../utils/errorResponce");
const asyncHandler = require("../middleware/async");

// @desc:    Get all reviews
//@route:    Get /api/v1/reviews
//@route:    Get /api/v1/reviews/:bootcampId/reviews
//@access:   Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  console.log(req.params.bootcampId);
  if (req.params.bootcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });

    return res
      .status(200)
      .json({ Success: true, count: reviews.length, data: reviews });
  } else {
    // Just get all reviews
    res.status(200).json(res.advancedResults);
  }
});

// @desc:    Get  a single review
//@route:    Get /api/v1/reviews/:reviewId
//@access:   Public
exports.getReview = asyncHandler(async (req, res, next) => {
  console.log(req.params.id);
  const review = await Review.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!review) {
    return next(new ErrorResponce("No review with that id", 404));
  }

  res.status(200).json({ Success: true, data: review });
});

// @desc:    create review
//@route:    POST /api/v1/bootcamps/:bootcampid/reviews
//@access:   Private
exports.createReview = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);
  if (!bootcamp) {
    return next(
      new ErrorResponce(`No bootcamp found with id ${req.params.id}`, 404)
    );
  }

  const review = await Review.create(req.body);
  res.status(201).json({ Success: true, data: review });
});

// @desc:    update review
//@route:    PUT /api/v1/reviews/:id
//@access:   Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);
  if (!review) {
    return next(new ErrorResponce(`No review with id ${req.params.id}`, 404));
  }

  // Make sure the actual user who owns the review is logged in or an admin is logged in
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponce(`Unauthorized access to update this review`, 401)
    );
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ Success: true, data: review });
});

// @desc:    delete review
//@route:    DEL /api/v1/reviews/:id
//@access:   Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);
  if (!review) {
    return next(new ErrorResponce(`No review with id ${req.params.id}`, 404));
  }

  // Make sure the actual user who owns the review is logged in or an admin is logged in
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponce(`Unauthorized access to update this review`, 401)
    );
  }

  await review.remove();

  res.status(200).json({ Success: true, data: {} });
});
