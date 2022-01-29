const app = require('./app');
const {connectDatabase} = require('./config/database');
connectDatabase();







app.listen(process.env.PORT,()=>{
    console.log(`listening on port ${process.env.PORT}`);
});

