const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String },
  email: { type: String },
  password: { type: String },

  isEmailVerified: { type: Boolean, default: false },
  emailVerifyOTP: { type: Number },
  emailVerifyExpiry: { type: Number },

  signUpDate: { type: String },
  loginCount: { type: Number },
});

module.exports = mongoose.model("User", userSchema);
