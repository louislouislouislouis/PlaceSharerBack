const HttpError = require("../model/http-err");
const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      throw new Error("Auth Failed");
    }
    const decodedtoken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedtoken.userId };
    next();
  } catch (err) {
    const error = new HttpError("Authorization failed", 403);
    return next(error);
  }
};
