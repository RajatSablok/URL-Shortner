const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String },
  email: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  emailVerifyOTP: { type: Number },
  emailVerifyExpirt: { type: Number },
  signUpDate: { type: String },
});

module.exports = mongoose.model("User", userSchema);
