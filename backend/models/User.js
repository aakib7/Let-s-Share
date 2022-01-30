const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required :[true,"Please Enter a Name"]
    },
    email:{
        type: String,
        required :[true,"Please Enter a Name"],
        unique : [true,"Email already exists"]
    },
    avatar:{
        public_id: String,
        url: String
    },
    password:{
        type: String,
        required :[true,"Please Enter a Password"],
        minLength:[6,"Password must be at least 6 characters"],
        select: false, // not select on select query
    },
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Post",
        }
    ],
    followers:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User", 
        }
    ],
    following:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User", 
        }
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,

});
// run before saving the schema
userSchema.pre("save", async function(next){
    if(this.isModified("password")){ // only bcrypt password if password modefy 
        this.password = await bcrypt.hash(this.password,10);
    }
    next();
});
userSchema.methods.getResetPasswordToken = () =>{
    // create a token and hesh that token and save in db at resetPasswordToken

    // here generate token which we send to user in email
    const resetToken = crypto.randomBytes(20).toString("hex");
    // crypt that token and save in the database with the user data
    this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
    // set expire time of token
    this.resetPasswordExpire = Date.now() + 10  * 60 * 1000;
    console.log(resetToken)
    return resetToken;

}
const User = mongoose.models.User || mongoose.model("User",userSchema);
module.exports = User;


