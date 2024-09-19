const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const { validateUserInput } = require('../middlewares/validationMiddleware');

// Route for user registration
router.post('/register', validateUserInput, userController.registerUser);

// Route for user login
router.post('/login', userController.loginUser);

// Route for getting a user's own profile (JWT protected)
router.get('/profile', authenticateJWT, userController.getUserProfile);

// Route for updating user's own profile (JWT protected)
router.put('/profile', authenticateJWT, userController.updateUserProfile);

// Route for getting all users (Admin only)
router.get('/all', authenticateJWT, userController.getAllUsers);

// Route for deleting a user by admin
router.delete('/:id', authenticateJWT, userController.deleteUser);

module.exports = router;