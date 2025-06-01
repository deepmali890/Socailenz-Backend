const express = require('express')
const userController = require('../controllers/user.controller')
const { protectRoute } = require('../middlewares/auth.middleware')
const fileHandle = require('../middlewares/multer')


const router = express.Router()

router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)

router.get('/profile/:id', userController.getProfile)
router.put('/edit-profile/:id', protectRoute, fileHandle, userController.editProfile);

// Route to get suggested users
router.get('/suggested-users', protectRoute, userController.getSuggestedUser);

// follow unfollow user
router.put('/follow/:id', protectRoute, userController.followOrUnfollow);

// serach user with username
router.get('/search', protectRoute, userController.serachUserByUserName);

module.exports = router