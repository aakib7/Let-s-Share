const Post = require('../models/Post');
const User = require('../models/User');

// create post 
exports.createPost = async(req,res)=>{
    try{
        const newPostData = {
            caption: req.body.caption,
            image: {
                public_id: "req.body.image",
                url: "req.body.url"
            },
            owner: req.user._id
        } 
        const post = await Post.create(newPostData);

        const user = await User.findById(req.user._id);
        user.posts.push(post._id);
        await user.save();

        res.status(201).json({success:true,post,});

    }catch(e){
        res.status(500).json({
            success: false,
            message:e.message
        });
    }

}

// Delete Posts
exports.deletePost = async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).send("Post Not Found");

        if(post.owner.toString() !== req.user._id.toString()){
            return res.status(401).json({
                success:false,
                message: "Unauthorized"
            });
        }
        await post.remove();
        // after removing the post from post we have to delete post from user's posts list
        const user = await User.findById(req.user._id);
        const index = user.posts.indexOf(req.params.id);
        user.posts.splice(index, 1);
        await user.save();


        return res.status(200).json({
            success:true, 
            message:"Post Delete Successfully"
        });

    }catch(err){
        res.status(500).json({
            success: false,
            message:e.message
        });
    }
}

// like and unlike post

exports.likeUnlikePost = async function(req, res){
    try{
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).send("Post Not Found");

        // if already like so dislike the post
        if(post.likes.includes(req.user._id)){
            // find that user index in the array of likes
            const index = post.likes.indexOf(req.user._id);
            // delete that id from likes array
            post.likes.splice(index, 1);
            await post.save();
            return res.status(200).json({
                success:true,
                message:"Post Unliked"
            });
        }
        else{
            // for like the post
            post.likes.push(req.user._id); //logged in user _id
            await post.save();
            return res.status(200).json({
                success:true,
                message:"Post Liked"
            });
        }
        
        

    }catch(e){
        res.status(500).json({
            success: false,
            message:e.message
        });
    }
}

// follow User 
exports.followUnfollowUser = async (req,res) => {
    try{
        const userToFollow = await User.findById(req.params.id);
        const loggedInUser = await User.findById(req.user._id);
        if(!userToFollow) return res.status(401).send("User Not Found");
        if(loggedInUser){
            // if already follow then unfollow the user
            if(loggedInUser.following.includes(userToFollow._id)){

                // remove user from the following list
                const indexOFFollowing = loggedInUser.following.indexOf(userToFollow._id);
                loggedInUser.following.splice(indexOFFollowing, 1);

                // remove from follower list 
                const indexOFFollower = userToFollow.followers.indexOf(loggedInUser._id);
                userToFollow.followers.splice(indexOFFollower, 1);
                await userToFollow.save();
                await loggedInUser.save();

                return res.status(200).json({
                    success:true,
                    message: "User Unfollow Successfully"
                    });
            }
            else{
                loggedInUser.following.push(userToFollow._id);
                userToFollow.followers.push(loggedInUser._id);
                await userToFollow.save();
                await loggedInUser.save();
                return res.status(200).json({
                    success:true,
                    message: "User follow Successfully"
                    });
            }
        }

    }catch(e){
        res.status(500).json({
            success: false,
            message:e.message
        });
    }
}

exports.getPostOfFollowing = async (req,res) => {
    try{
        // const user = await User.findById(req.user._id).populate("following","posts");
        // in user we have an array of following which store the follinf users id 
        // with popolate mongo get all the posts data with the help od ids and populate here

        // or 
        const user = await User.findById(req.user._id);
    
        const posts = await Post.find({
            owner:{$in:user.following},  
            // user.following is an array which contain more then one posts id so use $in
        });

        res.status(200).json({
            success:true,
            posts,
        });

    }catch(e){
        res.status(500).json({
            success: false,
            message:e.message
        });
    }
}

// update post caption
exports.updateCaption = async (req,res)=>{
    try{
        const post = await Post.findById(req.params.id);
        const {caption} = req.body;

        if(!post) return res.status(404).send("Post Not Found");

        if(post.owner.toString() !== req.user._id.toString()){
            return res.status(404).send("Unauthorized");}
            
        if(caption){
            post.caption = caption;
        }
        await post.save();
        return res.status(200).json({
            success: true,
            message:"Update Caption Successfully"
        });

    }catch(err){
        res.status(500).json(
            {
                success: false,
                message: err.message,
            });
    }
}
// add comments
exports.addComment = async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);
        if(!post) {return res.status(404).json({
            success:false,
            message:"Post Not Found"});
        }
        
        // check user has comment on this post
        let commentIndex = -1;
        post.comments.forEach((item,index) =>{
            if(item.user.toString() === req.user._id.toString()){
                commentIndex = index;
            }
        });
        
        // add new comment or update comment 
        if(commentIndex !== -1){
            post.comments[commentIndex].comment = req.body.comment;
            await post.save();
        return res.status(200).json({
            success: true,
            message:"Comment updated successfully",
        });

        }
        else{
            post.comments.push({
            user: req.user._id,
            comment:req.body.comment,
        });
        await post.save();
        return res.status(200).json({
            success: true,
            message:"Comment Added successfully",
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

// delete comments 
exports.deleteComment = async (req,res)=>{
    try{
        const post = await Post.findById(req.params.id);
        if(!post) {return res.status(404).json({
            success:false,
            message:"Post Not Found"});
        }
        
        if(post.owner.toString() === req.user._id.toString()) // login user is owner of post 
         {
            if(req.body.commentId == undefined) {
            return res.status(404).json({
                success:false,
                message:"Please add Comment ID"
            })
        }
            post.comments.forEach((item,index) =>{
            if(item._id.toString() === req.body.commentId.toString()){
                return post.comments.splice(index, 1); 
            }});
        await post.save();
        return res.status(200).json({success:true,message:"Selected Comment delete"})
         }
        else{
            // other user who comment on post 
        post.comments.forEach((item,index) =>{
            if(item.user.toString() === req.user._id.toString()){
                return post.comments.splice(index, 1); 
            }
        });
        await post.save();
        return res.status(200).json({success:true,message:"Comment delete"});

        }

    }catch(err){
        res.status(500).json(
            {
                success: false,
                message: err.message,
            });
    }
}

exports.forgetPassword = async (req,res)=>{
    try{
        const user = await User.findOne({email:req.body.email});
        if(!user){return res.status(404).json({
            success: false,
            message:"User Not Exist With Given Mail"
        })}

    }catch(err){
        res.status(500).json(
            {
                success: false,
                message: err.message,
            });

    }
}