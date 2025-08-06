const express = require('express');
const authRouter =  express.Router();
const {register,login,logout,deleteProfile} = require('../controllers/userAuthController')
const userMiddleware = require("../middleware/userMiddleware");

// Register
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout', userMiddleware, logout);


// checking 
authRouter.get('/check',userMiddleware,(req,res)=>{
    const reply = {
        firstName: req.info.firstName,
        emailId: req.info.emailId,
        _id:req.info._id,
    }

    res.status(200).json({
        user:reply,
        message:"Valid User"
    });
})


module.exports = authRouter;