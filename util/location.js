const axios = require("axios");
const API_KEY = process.env.GOOGLE_API_KEY;
//"AIzaSyAm7QJ6Z1K6EuzBLEZ7lVY9YjfU0qEwXYo";
const HttpError = require("../model/http-err");

async function getCoordsForAdress(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );
  const data = response.data;
  if (!data || data.status === "ZERO_RESULTS") {
    const errror = new HttpError("Could not find location for address", 422);
    throw errror;
  }
  const coordinates = data.results[0].geometry.location;
  console.log(coordinates);
  return coordinates;
}
module.exports = getCoordsForAdress;
