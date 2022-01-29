const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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
});
// run before saving the schema
userSchema.pre("save", async function(next){
    if(this.isModified("password")){ // only bcrypt password if password modefy 
        this.password = await bcrypt.hash(this.password,10);
    }
    next();
});
const User = mongoose.models.User || mongoose.model("User",userSchema);
module.exports = User;


