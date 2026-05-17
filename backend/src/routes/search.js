const express = require("express");
const router = express.Router();
const { searchBuses } = require("../controllers/searchController");

// Search is public — no login required
router.get("/", searchBuses);

module.exports = router;
