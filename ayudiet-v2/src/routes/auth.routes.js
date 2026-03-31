const express = require("express");

// IMPORT BOTH FUNCTIONS FROM CONTROLLER
const { signup, login } = require("../controllers/auth.controller");

const router = express.Router();

// Signup route
router.post("/signup", signup);

// Login route
router.post("/login", login);


module.exports = router;
