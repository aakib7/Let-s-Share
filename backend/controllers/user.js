const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../middlewares/sendEmail");
const crypto = require("crypto");

// register
exports.register = async (req,res)=>{
    try{
        const {name,email,password} = req.body;

        let user = await User.findOne({email});
        if (user){
            return res.status(400).json({
                success:false,message:"User already registered"});
            }
        else{
            user = await User.create({name,email,password,
                avatar:{public_id:"sample_id",url:"sample_url"}});
                
            // register automatically login user

            const token = jwt.sign(
                    {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    },
                    process.env.jwtPrivateKey
                );
                return res.status(200).cookie("token",token,{
                    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    httpOnly: true
                }).json({
                    success:true,
                    user,
                    token,});
        }

    }catch(error){
        res.status(500).json(
            {
                success: false,
                message: error.message,
            });
    }
}
// login 
exports.login = async (req,res) => {
    try{
        const {email,password} = req.body;

        const user = await User.findOne({email: email}).select("+password");
        // because select:false for password to select password we use select(+password)
        
        if(!user) {
            return res.status(400).json({
                success:false, 
                message:"user not exist"
            });
        }
        else{
            const validPassword = await bcrypt.compare(password, user.password);
            if(!validPassword){
                return res.status(400).json({
                success:false, 
                message:"Incorrect Password"
            });
            }
            else{
                const token = jwt.sign(
                    {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    },
                    process.env.jwtPrivateKey
                );
                return res.status(200).cookie("token",token,{
                    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    httpOnly: true
                }).json({
                    success:true,
                    user,
                    token,});
            }
        }

    }catch(error) {
        res.status(500).json(
            {
                success: false,
                message: error.message,
            });
    }
}
// logout the user
exports.logout = async (req,res) => {
    try{
        return res.status(200).cookie("token",null,{ 
            expires : new Date(Date.now()),
            httpOnly : true
        }).json({
            success : true,
            message : "User logged Out"
        });
    }catch(error) {
        res.status(500).json(
            {
                success: false,
                message: error.message,
            });
    }
}

// update password

exports.updatePassword = async (req,res) => {
    try{

        const {oldPassword,newPassword} = req.body;
        if(!oldPassword || !newPassword) {
            return res.status(400).json({
                success:false,message:"Provide Old and New Password"
            });}

        const user = await User.findById(req.user._id).select("+password");
        const validPassword = await bcrypt.compare(oldPassword, user.password);
        if(!validPassword){
            return res.status(400).json({
            success:false, 
            message:"Incorrect Old Password"
            });
        }
        else{
            user.password = newPassword;
            await user.save();
            return res.status(200).json({
                success:true, 
                message:"Password Changed successfully",
            })
        }


    }catch(err){
        res.status(500).json(
            {
                success: false,
                message: err.message,
            });
    }
}

// update Profile
exports.updateProfile = async (req,res)=>{
    try{
        const user = await User.findById(req.user._id);
        const {name,email} = req.body;
        if(name){
            user.name = name;
        }
        if (email){
            const emailCheck = await User.findOne({email});
            if(emailCheck){
                return res.status(401).json({
                    success: false,message:"User Already exist",
                });
            }
            user.email = email;
        }
        //User avatar TODO
        await user.save();
        return res.status(200).json({
            success: true,
            message:"Update User Successfully"
        });

    }catch(err){
        res.status(500).json(
            {
                success: false,
                message: err.message,
            });
    }
}

// delete user Account
// also delete all users posts 

exports.deleteMyAccount = async (req,res)=>{
    try{
        const user = await User.findById(req.user._id);
        const userId = user._id;
        const posts = user.posts;
        const followers = user.followers;
        const following = user.following;
        await user.remove();

        // logout user
        res.cookie("token",null,{ 
            expires : new Date(Date.now()),
            httpOnly : true
        });
        // delete all posts of user
    if(posts) {
        for (let i=0; i<posts.length; i++){
            const post = await Post.findById(posts[i]);
            await post.remove();
        }
    }
        // go to user followers list, and delete user from other following
        // Removing User from followers following
    if(followers) {
        for (let i=0; i<followers.length; i++){
            const follower = await User.findById(followers[i]); // -> who following that user
            const indexOfFollow = follower.following.indexOf(userId);
            follower.following.splice(indexOfFollow, 1);
            await follower.save();
        }
    }
    // removing User from following's followers
    if(following) {
        for (let i=0; i<following.length; i++){
            const follows = await User.findById(following[i]); // -> who following that user
            const index = follows.followers.indexOf(userId);
            follows.followers.splice(index, 1);
            await follows.save();
        }
    }

        return res.status(200).json({success:true,message:"delete user"});

    }catch(err){
        res.status(500).json(
            {
                success: false,
                message: err.message,
            });
    }
}

// my profile 
exports.myProfile = async (req,res) => {
    try{
        const user = await User.findById(req.user._id).populate("posts");

        return res.status(200).json({ 
            success:true,
            user,
        })

    }catch(err){
        res.status(500).json(
            {
                success: false,
                message: err.message,
            });
    }
}

// get a user user

exports.getUserProlile = async (req,res) => {
    try{
        const user = await User.findById(req.params.id).populate("posts");
        if(!user){return res.status(404).json({
            success:false,
            message:"user not found"});
        }
        return res.status(200).json({
            success:true,
            user,});

    }catch(err){
        res.status(500).json(
            {
                success: false,
                message: err.message,
            });
    }

}
exports.getAllUser = async (req,res) => {
    try{
        const user = await User.find({});
        return res.status(200).json({
            success:true,
            user,});

    }catch(err){
        res.status(500).json(
            {
                success: false,
                message: err.message,
            });
    }
}
// for get password
exports.forgetPassword = async(req,res)=>{
    try{
        const user = await User.findOne({email:req.body.email});
        if(!user){ return res.status(404).json({
                        success:false,
                        message:"user not found"});
        }
        const resetPasswordToken = user.getResetPasswordToken();
        await user.save(); // now that method call and token save in the db

        const resetUrl = `${req.protocol}://${req.get("host")}/api/user/password/reset/${resetPasswordToken}`;
        const message = `Reset Your Password by clicking the link below \n\n${resetUrl}`;
        try{
            await sendEmail({
                email:user.email,
                subject:"Reset Password",
                message,
            });
            return res.status(200).json({
                success:true,
                message:"Email sent to "+user.email+" successfully",
            });

        }catch(e){
            
            user.resetPasswordToken = undefined
            user.resetPasswordExpire = undefined
            // undefined because our maill not sent we set these in db but now set them again undefined
            await user.save();

            res.status(500).json({
                success: false,
                message:e.message
            });   
        }
    }catch(err){
        res.status(500).json(
            {
                success: false,
                message: err.message,
            });
    }
}

exports.resetPassword = async (req,res) => {
    try{
        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire : {$gt:Date.now()}
        });

        if(!user){
            return res.status(401).json({
                success: false,
                message:"Token Expired or Invalid"
            });
        }
        else{
            user.password = req.body.password;

            user.resetPasswordToken = undefined
            user.resetPasswordExpire = undefined

            await user.save();
            return res.status(200).json({
                success: true,
                message:"Password Updated successfully"
            });

        }

    }catch(err){
        res.status(500).json(
            {
                success: false,
                message: err.message,
            });
    }

}