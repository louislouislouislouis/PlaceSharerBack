const HttpError = require("../model/http-err");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../model/user-model");

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Error input", 422));
  }

  const { name, email, password } = req.body;

  let existinguser;
  try {
    existinguser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "singing dfailed, plaease try again later",
      500
    );
    return next(error);
  }

  if (existinguser) {
    const error = new HttpError(
      "User already exist, please login instead",
      422
    );
    return next(error);
  }
  let hashedpassword;
  try {
    hashedpassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user please try again", 500);
    return next(error);
  }

  const newUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedpassword,
    places: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    const error = new HttpError(
      "siuffp up failed, please try again later",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "siuffp up failed, please try again later",
      500
    );
  }

  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};
const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existinguser;
  try {
    existinguser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging dfailed, plaease try again later",
      500
    );
    return next(error);
  }
  if (!existinguser) {
    const error = new HttpError("Invalid credential, could not find user", 401);
    return next(error);
  }
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existinguser.password);
  } catch {
    const error = new HttpError(
      "Logging dfailed, plaease try again later",
      500
    );
    return next(error);
  }
  if (!isValidPassword) {
    const error = new HttpError("Invalid credential", 403);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existinguser.id, email: existinguser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("login up failed, please try again later", 500);
  }

  res.status(201).json({
    userId: existinguser.id,
    email: existinguser.email,
    token: token,
  });
};
const getallusers = async (req, res, next) => {
  let Users;
  try {
    Users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching user failed, plaease try again later",
      500
    );
    return next(error);
  }
  res.json({ users: Users.map((u) => u.toObject({ getters: true })) });
};
exports.signup = signup;
exports.login = login;
exports.getallusers = getallusers;
