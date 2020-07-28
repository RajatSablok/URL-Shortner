const mongoose = require("mongoose");

const urlSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  longURL: { type: String },
  shortURL: { type: String },
  shortCode: { type: String },
});

module.exports = mongoose.model("URL", urlSchema);
