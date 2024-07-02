const asyncHandler = require("express-async-handler");
const { Country, State, City } = require("country-state-city");
const AppError = require("../middleware/AppError");

// @desc    Get all countries
// @route   GET /api/csc/countries
// @access  Public
module.exports.getAllCountries = asyncHandler(async (req, res, next) => {
  const countries = Country.getAllCountries();
  return res.status(200).json({
    success: true,
    data: countries,
  });
});

// @desc    Get all states for a country
// @route   GET /api/csc/states
// @access  Public
module.exports.getAllStates = asyncHandler(async (req, res, next) => {
  const { country } = req.query;

  if (!country) {
    return next(new AppError("Please provide country name", 400));
  }

  const countryData = Country.getAllCountries().find((c) => c.name === country);

  if (!countryData) {
    return next(new AppError("Country not found", 404));
  }

  const states = State.getStatesOfCountry(countryData.isoCode);
  return res.status(200).json({
    success: true,
    data: states,
  });
});

// @desc    Get all cities for a state
// @route   GET /api/csc/cities
// @access  Public
module.exports.getAllCities = asyncHandler(async (req, res, next) => {
  const { country, state } = req.query;

  if (!country || !state) {
    return next(
      new AppError("Please provide country name and state name", 400)
    );
  }

  const countryData = Country.getAllCountries().find((c) => c.name === country);

  if (!countryData) {
    return next(new AppError("Country not found", 404));
  }

  const stateData = State.getStatesOfCountry(countryData.isoCode).find(
    (s) => s.name === state
  );

  if (!stateData) {
    return next(new AppError("State not found", 404));
  }

  const cities = City.getCitiesOfState(countryData.isoCode, stateData.isoCode);
  return res.status(200).json({
    success: true,
    data: cities,
  });
});
