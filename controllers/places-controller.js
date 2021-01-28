const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const HttpError = require("../model/http-err");
const getCoordsForAdress = require("../util/location");
const Place = require("../model/places-model");
const User = require("../model/user-model");
const Mongoose = require("mongoose");
const fs = require("fs");
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("something wrong", 500);
    return next(error);
  }
  console.log("GET REQUEST IN PLACES");

  if (!place) {
    error = new HttpError("Could not find a place for the placeId", 404);
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  //let places;
  let userwithPlaces;
  try {
    //places = await Place.find({ creator: userId });
    userwithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError("something wrong", 500);
    return next(error);
  }

  if (!userwithPlaces || userwithPlaces.places.length === 0) {
    return next(new HttpError("Could not find a places for the userId", 404));
  }
  res.json({
    places: userwithPlaces.places.map((p) => p.toObject({ getters: true })),
  });
};

const createPlaces = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Error input", 422));
  }

  const { title, description, address, creator } = req.body;
  let coordinate;

  try {
    coordinate = await getCoordsForAdress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlaces = new Place({
    title,
    description,
    address,
    location: coordinate,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Creaing place failed", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided Id", 500);
    return next(error);
  }

  try {
    const sess = await Mongoose.startSession();
    sess.startTransaction();
    await createdPlaces.save({ session: sess });
    user.places.push(createdPlaces);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("cannot add place", 500);
    return next(error);
  }

  res.status(201).json({ place: createdPlaces });
};

const deletePlaces = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError("something wrong", 500);
    return next(error);
  }
  if (!place) {
    const error = new HttpError("Could not find place for this id wrong", 500);
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError("Please, do not play that game with me", 401);
    return next(error);
  }

  const imagePath = place.image;
  try {
    const sess = await Mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("somethffing wrong", 500);
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.status(200).json({ message: "delet place" });
};
const updatePlaces = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Errrror input", 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("something wrong", 500);
    return next(error);
  }
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("not allowed dirty bastard", 401);
    return next(error);
  }
  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError("somethffing wrong", 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlaces = createPlaces;
exports.deletePlaces = deletePlaces;
exports.updatePlaces = updatePlaces;
