const router = require("express").Router();
const {
  getAllCountries,
  getAllStates,
  getAllCities,
} = require("../controllers/csc.controller");

router
  .get("/countries", getAllCountries)
  .get("/states", getAllStates)
  .get("/cities", getAllCities);

module.exports = router;
