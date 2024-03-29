const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateUser,
  updatePassword,
  logout,
} = require("../controllers/auth");
const { protect } = require("../middleware/auth");

router.route("/register").post(register);

router.route("/login").post(login);

router.route("/logout").get(logout);

router.route("/me").get(protect, getMe);

router.route("/updatedetails").put(protect, updateUser);

router.route("/changepassword").put(protect, updatePassword);

router.route("/forgotpassword").post(forgotPassword);

router.route("/resetpassword/:resetToken").put(resetPassword);

module.exports = router;
