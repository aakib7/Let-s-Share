const express = require('express');
const { register, login, logout, updatePassword,updateProfile,deleteMyAccount, myProfile, getUserProlile, getAllUser,forgetPassword,resetPassword } = require('../controllers/user');
const { followUnfollowUser } = require('../controllers/posts');
const { isAuthenticated } = require('../middlewares/auth');

const router = express.Router();

// router.route('/register').get((req,res) => {res.send("Helli")});
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/me').get(isAuthenticated,myProfile);

// get single and all user
router.route("/users").get(isAuthenticated,getAllUser);
router.route("/:id").get(isAuthenticated,getUserProlile);

router.route('/update/password').put(isAuthenticated,updatePassword);

router.route("/forgot/password").post(forgetPassword);
router.route("/password/reset/:token").put(resetPassword);

router.route('/update/profile').put(isAuthenticated,updateProfile);
router.route("/delete/me").delete(isAuthenticated,deleteMyAccount);

router.route("/follow/:id").get(isAuthenticated,followUnfollowUser);



module.exports = router;