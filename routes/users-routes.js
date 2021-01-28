const userControllers = require("../controllers/users-controller");
const { check } = require("express-validator");

const express = require("express");
const fileUpload = require("../Middleware/file-upload");
const router = express.Router();

router.get("/", userControllers.getallusers);
router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  userControllers.signup
);
router.post("/login", userControllers.login);

module.exports = router;
