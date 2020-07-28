const mongoose = require("mongoose");

const urlSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  longURL: { type: String },
  shortURL: { type: String },
  shortCode: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: { type: String },
  numClicks: { type: Number, default: 0 },
});

module.exports = mongoose.model("URL", urlSchema);
