const express = require("express");
const mongoose = require("mongoose");
const otpGenerator = require("otp-generator");
const URL = require("../models/url");

const router = express.Router();

router.post("/", async (req, res) => {
  const { longURL } = req.body;

  const shortCode = otpGenerator.generate(6, {
    digits: false,
    upperCase: false,
    specialChars: false,
    alphabets: true,
  });

  const shortURL = `${process.env.baseURL}/${shortCode}`;

  const newURL = new URL({
    _id: new mongoose.Types.ObjectId(),
    longURL,
    shortCode,
    shortURL,
  });

  await newURL.save();

  res.status(200).json({ shortCode, shortURL });
});

router.get("/:code", async (req, res) => {
  const { code } = req.params;

  await URL.findOne({ shortCode: code })
    .then(async (result) => {
      res.redirect(result.longURL);
    })
    .catch();
});

module.exports = router;
