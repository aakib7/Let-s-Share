const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');

if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config({path:"backend/config/config.env"});
}
// using middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());


// importing Routes
const post = require('./routes/post');
const user = require('./routes/user');


//Using Routes
app.use("/api/post",post); // url= localhost:400/api/post/.......goes to post
app.use('/api/user',user)


module.exports = app;