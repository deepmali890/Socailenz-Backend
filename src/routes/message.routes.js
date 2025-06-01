const express = require('express');
const { protectRoute } = require('../middlewares/auth.middleware');
const messageController = require('../controllers/message.controller');

const router = express.Router();

router.post('/send/:id', protectRoute, messageController.sendMessage)
router.get('/all/:id', protectRoute, messageController.getMessage)

module.exports = router;