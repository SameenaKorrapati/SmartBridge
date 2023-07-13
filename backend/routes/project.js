// routes/project.js

const express = require('express');
const projectController = require('../controllers/projectController');
const authenticateToken = require('../middleware/authenticate')

const router = express.Router();

router.post('/create', authenticateToken, projectController.create);
router.get('/', authenticateToken, projectController.getAll)
router.post('/:projectID/addUser', authenticateToken, projectController.addUser)
router.post('/:projectID/updatePermission', authenticateToken, projectController.updatePermission)
router.post('/:projectID/deleteUser', authenticateToken, projectController.deleteUser)
router.patch('/:projectID', authenticateToken, projectController.renameProject)
router.delete('/:projectID', authenticateToken, projectController.deleteProject)

module.exports = router