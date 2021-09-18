const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a title for the review"],
    trim: true,
    maxlength: 100,
  },

  text: {
    type: String,
    required: [true, "Please add some text"],
  },

  rating: {
    type: Number,
    required: [true, "Please add a rating between 1 and 10"],
    min: 1,
    max: 10,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  bootcamp: {
    // Relationship with bootcamp
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true, // a course cannot exist without a bootcamp
  },

  user: {
    // Relationship with User
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true, // a course cannot exist without a User
  },
});

//Prevent user from reviewing 1 bootcamp more than once
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// Calculate average rating of a Bootcamp
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId }, // Select * where bootcamp == bootcampId
    },
    {
      $group: {
        // All reviews belong to the same bootcamp(Id) will calculate average of raring for that bootcamp
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageRating: obj[0].averageRating,
    });
  } catch (err) {
    console.log(err);
  }
};

// Call getAverageCost after save
ReviewSchema.post("save", function () {
  this.constructor.getAverageRating(this.bootcamp);
});

// Call getAverageCost before remove
ReviewSchema.pre("remove", function () {
  this.constructor.getAverageRating(this.bootcamp);
});

module.exports = mongoose.model("Review", ReviewSchema);
