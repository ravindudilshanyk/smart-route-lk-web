const express = require("express");
const router = express.Router();
const {
	searchBuses,
	getStopSuggestions,
} = require("../controllers/searchController");

// Search is public - no login required
router.get("/stops", getStopSuggestions);
router.get("/", searchBuses);

module.exports = router;
