const express = require("express");
const mongoose = require("mongoose");
const otpGenerator = require("otp-generator");

const URL = require("../models/url");

const checkAuth = require("../middleware/checkAuth");

const router = express.Router();

//generate short url from longurl
router.post("/", checkAuth, async (req, res) => {
  const { longURL } = req.body;

  const createdBy = req.user.userId;

  const shortCode = otpGenerator.generate(6, {
    digits: false,
    upperCase: false,
    specialChars: false,
    alphabets: true,
  });

  const shortURL = `${process.env.baseURL}${shortCode}`;

  const createdAt = new Date();

  const newURL = new URL({
    _id: new mongoose.Types.ObjectId(),
    longURL,
    shortURL,
    shortCode,
    createdBy,
    createdAt,
  });

  await newURL
    .save()
    .then(async (result) => {
      res.status(201).json({
        message: "Short URL created",
        shortURL,
      });
    })
    .catch((err) => {
      res.status(400).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
});

//
router.get("/:code", async (req, res) => {
  const { code } = req.params;

  await URL.find({ shortCode: code })
    .then(async (result) => {
      if (result.length < 1) {
        return res.status(404).json({
          message: "URL not found",
        });
      } else {
        const longURL = result[0].longURL;
        const numClicks = result[0].numClicks + 1;
        const urlId = result[0]._id;

        await URL.updateOne({ _id: urlId }, { numClicks })
          .exec()
          .then(async (url) => {
            res.redirect(longURL);
          })
          .catch((err) => {
            res.status(400).json({
              message: "Something went wrong",
              error: err.toString(),
            });
          });
      }
    })
    .catch((err) => {
      res.status(400).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
});

module.exports = router;
