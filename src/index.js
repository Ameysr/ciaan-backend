const express = require('express');
const cors = require('cors');
require('dotenv').config();
const main =  require('./config/db');
const cookieParser =  require('cookie-parser');
const app = express();
const redisClient = require('./config/redis');
const authRouter = require('./routes/authRoute')
const postRouter = require('./routes/postRoute');
const userRouter = require('./routes/userRoute');


app.use(cors({
    origin: 'https://ciaan-frontend.onrender.com',
    credentials: true 
}))

app.use(express.json()); 
app.use(cookieParser()); 

app.use('/user',authRouter);
app.use('/post',postRouter);
app.use('/users', userRouter);



const InitalizeConnection = async ()=>{
    try{

        await Promise.all([main(),redisClient.connect()]);
        console.log("DB Connected");
        
        app.listen(process.env.PORT, ()=>{
            console.log("Server listening at port number: "+ process.env.PORT);
        })

    }
    catch(err){
        console.log("Error: "+err);
    }
}


InitalizeConnection();

