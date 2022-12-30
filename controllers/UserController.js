const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.signupUser = (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      return res.status(403).json({ message: "Account already exists" });
    } else {
      bcrypt.hash(req.body.password, 10).then((hash) => {
        const user = new User({
          email: req.body.email,
          password: hash,
        });
        user
          .save()
          .then(() => {
            res.status(201).json({ message: "New account created!" });
          })
          .catch((error) => {
            res.status(500).json({ error: error });
          });
      });
    }
  });
};

exports.loginUser = (req, res) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ message: "Account not found" });
      }

      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(403).json({ message: "Incorrect Password" });
          }

          const token = jwt.sign(
            { userId: user._id },
            `${process.env.JWT_TOKEN}`,
            {
              expiresIn: "24h",
            }
          );

          res.status(200).json({
            userId: user._id,
            token: token,
          });
        })
        .catch(() => {
          res.status(500).json({
            message: "Problem validating token",
          });
        });
    })
    .catch((error) => {
      res.status(500).json({
        error: error,
      });
    });
};
