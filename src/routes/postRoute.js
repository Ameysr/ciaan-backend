const express = require('express');
const router = express.Router();
const { 
    createPost, 
    getAllPosts, 
    updatePost, 
    deletePost, 
    likePost,
    createComment,
    getPostComments
} = require('../controllers/postController');
const userMiddleware = require("../middleware/userMiddleware");

// Post routes
router.post('/create', userMiddleware, createPost);
router.get('/feed', userMiddleware, getAllPosts);
router.put('/:postId', userMiddleware, updatePost);
router.delete('/:postId', userMiddleware, deletePost);

// Like routes
router.post('/:postId/like', userMiddleware, likePost);

// Comment routes
router.post('/:postId/comment', userMiddleware, createComment);
router.get('/:postId/comments', userMiddleware, getPostComments);

module.exports = router;