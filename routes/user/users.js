const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();

//Load User model
require("../../models/User");
const User = mongoose.model("users");
//Load Url model
require("../../models/Url");
const Url = mongoose.model("urls");

router.post("/login/", (req, res) => {
    const {username, password} = req.body;
    if(!username)
        errors.username = "username should not be empty";   
    if(!password)
        errors.password = "password should not be empty";
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
        if(newPassword !== confirmPassword){
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
              res.send("CREATED");
            })
            .catch(err => console.log(err));      
        })
    })
});


router.get("/:id", async (req, res) => {
    const {id} = req.params;

    try{
    const result = {}

    const user = await User.findOne({ _id : id}).exec();
    const urls = await Url.find({user_id : id}).exec();
    //console.log(urls)
        result.username = user.username,
        result.email = user.email,
        result.no_of_links_shortened = user.links_shortened
        result.no_of_active_urls = user.shortened_urls.length
        result.urls = []
        for(url of urls){
            const urlData = {
                original_url : url.original_url,
                shortened_url : url.shortened_url,
                no_of_redirections : url.no_of_redirections,
                is_api : url.is_api
            }
            result.urls.push(urlData)
        }
        //console.log(result)
        res.send(result);
   }catch(err){
    res.status(404)
    res.send({"error":"user not found"})
    return;    
   }

})

router.put("/changeUsername/:id", async (req, res) => {
    const {id} = req.params;
    const {newUsername} = req.body;

    const errors = {}

    if(!username){
        errors.username = "username should not be empty";
    }else{
        if(username.length < 5)
            errors.username = "username should of lenght atleast 5 characters";     
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

router.put("/changePassword/:id", async (req, res) => {
    const {id} = req.params;
    const {newPassword, confirmPassword} = req.body;
    const errors = {}

    if(!password){
        errors.password = "password should not be empty";
    }else{
        if(newPassword !== confirmPassword){
            errors.password = "Password mismatch";
        }else if(password.length < 8){
            errors.password = "Password should be of length atleast 8 characters";
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
                    res.send({"message" : "password updated successfully"})
                })
                .catch(err => {
                    res.status(400)
                    res.send({error : "password not updated"});
                })
        })
    })

})

router.put("/changeEmail/:id", async (req, res) => {
    const {id} = req.params;
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

module.exports = router;