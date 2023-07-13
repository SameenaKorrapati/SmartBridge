// routes / user.js

const express = require('express');
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authenticate');

const router = express.Router();

router.post('/login', userController.login);
router.post('/register', userController.register);
router.get('/', authenticateToken, userController.getAll);

module.exports = router;
