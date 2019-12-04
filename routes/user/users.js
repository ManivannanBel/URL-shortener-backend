const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const express = require("express");
const router = express.Router();

//Load User model
require("../../models/User");
const User = mongoose.model("users");
//Load Url model
require("../../models/Url");
const Url = mongoose.model("urls");

const keys = require("../../config/keys")
router.post("/login/", (req, res) => {
    const {email, password} = req.body;
    //console.log(req.body)

    const errors = {}
    if(!email)
        errors.email = "username should not be empty";   
    if(!password)
        errors.password = "password should not be empty";

        if(Object.keys(errors).length !== 0){
            res.status(400)
            res.send(errors)
            return;
        }
    

    User.findOne({email : email})
        .then(user => {
            if(!user){
                return res.status(404).json({error : "Email or password incorrect"});
            }
            
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if(isMatch){

                        const payload = {id : user._id, username : user.username}
                        //console.log(keys.secretOrKey)
                        //sign token
                        jwt.sign(payload, keys.secretOrKey, {expiresIn : 3600}, (err, token) => {
                            res.json({
                                success : true,
                                token : 'Bearer ' + token
                            })
                        })
                    }else{
                        res.status(404).json({error : "Email or password incorrect"});
                    }
                })
        })
    
})

router.post("/register", (req, res) => {

    const {username, email, password, confirmPassword} = req.body;
    const errors = {}

    if(!username){
        errors.username = "username should not be empty";
    }else{
        if(username.length < 5)
            errors.username = "username should of lenght atleast 5 characters";     
    }

    if(!password){
        errors.password = "password should not be empty";
    }else{
        if(password !== confirmPassword){
            errors.password = "Password mismatch";
        }else if(password.length < 8){
            errors.password = "Password should be of length atleast 8 characters";
        }   
    }

    if(!email)
        errors.email = "email should not be empty";


    if(Object.keys(errors).length !== 0){
        res.status(400)
        res.send(errors)
        return;
    }

    const newUser = {
      username,
      password,
      email
    };

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
            if(err) throw err;
            
            newUser.password = hash;

            new User(newUser)
            .save()
            .then(user => {
              res.send({success : "Account created successfully"});
            })
            .catch(err => console.log(err));      
        })
    })
});

//get user details
router.get("/", passport.authenticate("jwt", {session : false}) , async (req, res) => {
    const id = req.user._id;

    try{
    const result = {}

    const user = await User.findOne({ _id : id}).exec();
    const urls = await Url.find({user_id : id}).exec();
    //console.log(urls)
        result.username = user.username,
        result.email = user.email,
        result.noOfLinksShortened = user.links_shortened
        result.noOfActiveLinks = user.shortened_urls.length
        result.noOfLinksCreatedWithAPI = (urls.filter(url => url.is_api)).length
        result.hasApi = user.has_api
        result.totalNumberOfRedirections = 0
        result.apiKey = user._id
        for(url of urls){
            result.totalNumberOfRedirections += url.no_of_redirections
        }
        //console.log(result)
        res.send(result);
   }catch(err){
    res.status(404)
    res.send({error :"user not found"})
    return;    
   }

})

router.put("/changeUsername/", passport.authenticate("jwt", {session : false}) , async (req, res) => {
    const id = req.user._id;
    const {newUsername} = req.body;
   // console.log(req.body);
    const errors = {}

    if(!newUsername){
        errors.error = "username should not be empty";
    }else{
        if(newUsername.length < 5)
            errors.error = "username should of lenght atleast 5 characters";     
    }

    if(Object.keys(errors).length !== 0){
        res.status(400)
        res.send(errors)
        return;
    }

    try{
        const user = await User.findOneAndUpdate({_id : id}, {username : newUsername}).exec();
        res.send({username : newUsername});
    }catch(err){
        res.status(400)
        res.send({error : "error occured in updating username!"});
    }
})

router.put("/changePassword/", passport.authenticate("jwt", {session : false}) , async (req, res) => {
    const id = req.user._id;
    const {newPassword, confirmPassword} = req.body;
    const errors = {}

    if(!newPassword){
        errors.error = "password should not be empty";
    }else{
        if(newPassword !== confirmPassword){
            errors.error = "Password mismatch";
        }else if(newPassword.length < 8){
            errors.error = "Password should be of length atleast 8 characters";
        }
    }

    if(Object.keys(errors).length !== 0){
        res.status(400)
        res.send(errors)
        return
    }

    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newPassword, salt, (err, hash) => {
            if(err) throw err;
            
            User.findOneAndUpdate({_id : id}, {password : hash})
                .then(user => {
                    res.send({"success" : "password updated successfully"})
                })
                .catch(err => {
                    res.status(400)
                    res.send({error : "password not updated"});
                })
        })
    })

})

router.put("/changeEmail/", passport.authenticate("jwt", {session : false}) , async (req, res) => {
    const id = req.user._id;
    const {newEmail} = req.body;

    if(!newEmail){
        res.status(400)
        res.send({error : "email should of lenght atleast 5 characters"});
        return;
    }

    try{
        const user = await User.findOneAndUpdate({_id : id}, {email : newEmail}).exec();
        res.send({email : newEmail});
    }catch(err){
        res.status(400)
        res.send({error : "error occured in updating email!"});
    }
})

router.put("/enableAPIService/", passport.authenticate("jwt", {session : false}) , (req, res) => {

    const id = req.user._id;

    User.findOne({
        _id : id
    }).then(user => {
        user.has_api = true
        user.save()
            .then(user => {
                res.send({ success :"API service has been enabled by the user"})
            })
            .catch(err => {
                res.send({error : "error in updating, please try again"})
            })
    }).catch(err => {
        res.send({error : "error in reading db, please try again"})
    })

})

module.exports = router;