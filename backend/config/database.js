const mongoose = require("mongoose");


exports.connectDatabase = ()=>{
   mongoose
  .connect(process.env.DB, { useNewUrlParser: true })
  .then(() => console.log("Connected to " + process.env.DB))
  .catch((error) => console.log(error.message));
}