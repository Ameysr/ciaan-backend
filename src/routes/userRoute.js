const express = require('express');
const userRouter = express.Router();
const {getUserProfile, updateProfile} = require('../controllers/userController');
const userMiddleware = require("../middleware/userMiddleware");

// Profile routes
userRouter.get('/profile/:userId', getUserProfile);              // Get user profile + their posts
userRouter.put('/profileupdate', userMiddleware, updateProfile);       // Update own profile

module.exports = userRouter;