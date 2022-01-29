const express = require('express');
const { createPost, deletePost, likeUnlikePost, getPostOfFollowing ,updateCaption, addComment,deleteComment } = require('../controllers/posts');
const { isAuthenticated } = require('../middlewares/auth');
const router = express.Router();

router.route('/upload').post(isAuthenticated,createPost);

router.route("/:id").get(isAuthenticated,likeUnlikePost); 
router.route("/:id").delete(isAuthenticated,deletePost);
router.route("/following/post").get(isAuthenticated,getPostOfFollowing);
router.route("/update/caption/:id").put(isAuthenticated,updateCaption);
router.route("/comment/:id").put(isAuthenticated,addComment); // update and post
router.route("/delete/comment/:id").delete(isAuthenticated,deleteComment); // id of post




module.exports = router;