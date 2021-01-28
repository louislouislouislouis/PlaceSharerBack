const express = require("express");
const { check } = require("express-validator");
const fileUpload = require("../Middleware/file-upload");
const checkauth = require("../Middleware/check-auth");

const router = express.Router();

const placeControllers = require("../controllers/places-controller");

router.get("/:pid", placeControllers.getPlaceById);

router.get("/user/:uid", placeControllers.getPlacesByUserId);

router.use(checkauth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placeControllers.createPlaces
);

router.delete("/:pid", placeControllers.deletePlaces);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placeControllers.updatePlaces
);

module.exports = router;
