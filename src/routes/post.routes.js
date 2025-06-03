const express = require('express');
const { protectRoute } = require('../middlewares/auth.middleware');
const fileHandle = require('../middlewares/multer');
const postController = require('../controllers/post.controller');

const router = express.Router();

// curd post 
router.post('/createPost', protectRoute, fileHandle, postController.addNewPost)
router.get('/AllPost', protectRoute, postController.getAllPosts)
router.get('/user/:userId/posts', protectRoute, postController.getUserPost)
router.delete('/posts/:postId/deletePost', protectRoute, postController.deletePost)

// like/unlike logic
router.put('/posts/:postId/like', protectRoute, postController.toggleLikePost)
router.get('/likes', protectRoute, postController.allLikedPostByUser)

// coments 
router.post('/posts/:postId/comment', protectRoute, postController.addComment)
router.get('/posts/:postId/comments', protectRoute, postController.getAllCommentsByPost)

// bookmarks
router.put('/posts/:postId/bookmark', protectRoute, postController.bookMarkPost)
router.get('/bookmark', protectRoute, postController.AllBookMarksByUser)




module.exports = router;