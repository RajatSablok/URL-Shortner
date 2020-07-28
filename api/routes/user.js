const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const sgMail = require("@sendgrid/mail");
const otpGenerator = require("otp-generator");

const URL = require("../models/url");
const User = require("../models/user");

const EmailTemplates = require("../../emailTemplates");

sgMail.setApiKey(process.env.SendgridAPIKey);

const router = express.Router();

//User signup
router.post("/signup", async (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length >= 1) {
        res.status(409).json({
          message: "Email already exists",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              message: "Something went wrong",
              error: err.toString(),
            });
          } else {
            const newUser = new User({
              _id: new mongoose.Types.ObjectId(),
              email: req.body.email,
              password: hash,
              name: req.body.name,
              signUpDate: new Date(),
              loginCount: 0,
            });
            newUser
              .save()
              .then((result) => {
                const OTP = otpGenerator.generate(6, {
                  digits: true,
                  upperCase: false,
                  specialChars: false,
                  alphabets: false,
                });

                result.emailVerifyOTP = OTP;
                result.emailVerifyExpiry =
                  new Date().getTime() + 20 * 60 * 1000;
                result
                  .save()
                  .then(async (result2) => {
                    console.log(result2);
                    const msg = {
                      to: req.body.email,
                      from: process.env.sendgridEmail,
                      subject: "Teeny Tiny: Email Verification",
                      text: `Please use the following code to verify your account: ${result2.emailVerifyOTP}`,
                    };
                    sgMail
                      .send(msg)
                      .then(async (mailSent) => {
                        res.status(201).json({
                          message: "User created",
                          userDetails: {
                            userId: result._id,
                            userName: result.name,
                            email: result.email,
                          },
                        });
                      })
                      .catch((err) => {
                        res.status(400).json({
                          message: "Something went wrong",
                          error: err.toString(),
                        });
                      });
                  })
                  .catch((err) => {
                    res.status(403).json({
                      message: "Email Error",
                    });
                  });
              })
              .catch((err) => {
                res.status(400).json({
                  error: err.toString(),
                });
              });
          }
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

//Verify email
router.post("/email/verify", async (req, res) => {
  const { userId, verificationKey } = req.body;
  const now = new Date().getTime();

  await User.findById({ _id: userId })
    .then(async (user) => {
      if (user.emailVerifyOTP == verificationKey) {
        if (now < user.emailVerifyExpiry) {
          await User.updateOne(
            { _id: userId },
            { $set: { isEmailVerified: true } }
          )
            .then((result) => {
              res.status(200).json({
                message: "Verification successful",
              });
            })
            .catch((err) => {
              res.status(400).json({
                message: "Verification failed",
                error: err.toString(),
              });
            });
        } else {
          res.status(403).json({
            message: "Key expired",
          });
        }
      } else {
        res.status(403).json({
          message: "Wrong verification key",
        });
      }
    })
    .catch((err) => {
      res.status(404).json({
        error: err.toString(),
      });
    });
});

//User login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  await User.find({ email })
    .exec()
    .then(async (user) => {
      if (user.length < 1) {
        return res.status(404).json({
          message: "Auth failed: Email not found1",
        });
      }

      if (!user[0].isEmailVerified) {
        return res.status(403).json({
          message: "Please verify your email to continue",
        });
      } else {
        bcrypt.compare(password, user[0].password, (err, result) => {
          if (err) {
            return res.status(401).json({
              message: "Auth failed",
            });
          }
          if (result) {
            const token = jwt.sign(
              {
                userId: user[0]._id,
                email: user[0].email,
                name: user[0].name,
                loginCount: user[0].loginCount,
              },
              process.env.jwtSecret,
              {
                expiresIn: "30d",
              }
            );
            User.findOne({
              email,
            })
              .select("-__v -password")
              .exec()
              .then(async (thisUser) => {
                thisUser.loginCount = user[0].loginCount + 1;

                await thisUser
                  .save()
                  .then((result2) => {
                    return res.status(200).json({
                      message: "Auth successful",
                      userDetails: {
                        userId: user[0]._id,
                        email: user[0].email,
                        name: user[0].name,
                        loginCount: thisUser.loginCount,
                      },
                      token: token,
                    });
                  })
                  .catch((err) => {
                    res.status(400).json({
                      error: err.toString(),
                    });
                  });
              })
              .catch((err) => {
                res.status(400).json({
                  error: err.toString(),
                });
              });
          } else {
            res.status(401).json({
              message: "Auth failed",
            });
          }
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
