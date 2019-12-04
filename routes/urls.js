const keyGeneration = require("../sevices/keyGenerationService")
const isUrlValid = require("url-validation");
const urlExists = require("url-exists");
const mongoose = require("mongoose");
const passport = require("passport")
const express = require("express");
const router = express.Router();

//Load User model
require("../models/User");
const User = mongoose.model("users");
//Load Url model
require("../models/Url");
const Url = mongoose.model("urls");
//Load Key model
require("../models/Key");
const Key = mongoose.model("keys");

router.post("/",  passport.authenticate("jwt", {session : false}), (req, res) => {

    const id = req.user._id;
    const {url} = req.body;
    const errors = {}

    if(!url){
        errors.error = "Url should not be empty";
    }

    //console.log(url)

    if(!validateUrl(url)){
        errors.error = "Enter the url in correct format, Eg: https://www.example.com or http://www.example.com";
    }

    if(Object.keys(errors).length !== 0){
        res.status(400);
        res.send(errors);
        return;
    }

    //If the user has already shortened the url
    Url.findOne({
        original_url : url,
        user_id : id
    })
    .then(urlFound => {
        if(urlFound){    //If the user already has the url shortened then return the shortened link and and error msg
            const message = {}
            message.updateList = false;
            message.success = "You have shortened this url already";
            message.url = urlFound;
            //res.status(400);
            res.send(message);
            return;
        }else{  //Else create a new shortened url and store it in db
            //Find the user exists
    User.findOne({
        _id : id
    })  
     .then(user => {
        const currentDate = new Date();
        keyGeneration(id, url)
        .then(key => {
            const newUrl = {
                original_url : url,
                shortened_url : key,
                user_id : user._id,
                creation_time : currentDate,
                expiration_time : new Date().setFullYear(currentDate.getFullYear() + 1)
            }
            
            //console.log("new " + newUrl.shortened_url);

            //If the user exists, then create a new url
            new Url(newUrl)
             .save()
             .then(url => {
                //Update the shortened_url reference in users document 
                user.shortened_urls.push(url._id)
                user.links_shortened += 1
                user.save()
                    .then(user => {
                        res.status(200);
                        url.user_id = ""
                        res.send({updateList : true, url : url, success : "Url shortened successfully"});
                        return;
                    })
                    .catch(err => console.log("url id not updated in the user document"))
             })
             .catch(err => {
                 //Mostly occurs due to duplicate keygeneration
                 console.log("url not created")
                 res.status(400)
                 res.send({"error" : "url not shortened, please try again"})
             })
        })


     })
     .catch(err => {
         res.status(404);
         res.send({"error":"user not found"})
     })
        }
    })

   // console.log(url)
    
});

router.delete("/", passport.authenticate("jwt", {session : false}), (req, res) => {
    const id = req.user._id;
    const {url} = req.body;
   // console.log(req.body);
    const errors = {}

    if(!url){
        errors.error = "Url should not be empty";
    }

    if(Object.keys(errors).length !== 0){
        res.status(400)
        res.send(errors)
        return;
    }

    Url.findOne({
        original_url : url,
        user_id : id
    })
     .then(url => {
         const urlId = url._id
         //console.log("url found "+ urlId)
         User.findOne({
            _id : id
         })
         .then(user => {
            
            if(user.shortened_urls.includes(urlId)){
                const shortened_key = url.shortened_url;
                url.remove()
                //console.log(user.shortened_urls[0])
                user.shortened_urls = user.shortened_urls.filter(a =>{ return (!a.equals(urlId))})
                //user.links_shortened -= 1
                //console.log(user.shortened_urls)
                user.save()
                    .then(user => {
                        Key.findOneAndUpdate({key : shortened_key}, {available : true}).exec();
                        res.send({ url : shortened_key ,success : "Url deleted successfully"});
                    })
                    .catch(err => console.log("Url deleted from URL model but not in user list"))
            }else{
                console.log("urlid and user's doesn't match")
            }
         })
     })
     .catch(err => {
         res.status(404)
         res.send({"error" : "url not found"})
     })
})

router.get("/urls/", passport.authenticate("jwt", {session : false}), (req, res) => {
    const id = req.user._id;

    Url.find({
        user_id : id
    })
    .select("-user_id")
    .then(urls => {
        res.send(urls);
    }).catch(err => {
        res.status(400)
        res.send({"error" : "Error in fetching urls"});
    })


})

router.post("/anonymousShorten/", (req, res) => {

    //const id = req.user._id;
    const {url} = req.body;
    const errors = {}
    //console.log(url)
    if(!url){
        errors.error = "Url should not be empty";
    }

    //console.log(url)

    if(!validateUrl(url)){
        errors.error = "Enter the url in correct format, Eg: https://www.example.com or http://www.example.com";
    }

    if(Object.keys(errors).length !== 0){
        res.status(400);
        res.send(errors);
        return;
    }

    const currentDate = new Date();
    keyGeneration("", url)
    .then(key => {
        const newUrl = {
            original_url : url,
            shortened_url : key,
            //user_id : user._id,
            creation_time : currentDate,
            expiration_time : new Date().setMonth(currentDate.getMonth() + 1)
        }
        
        //If the user exists, then create a new url
        new Url(newUrl)
         .save()
         .then(url => {
            //Update the shortened_url reference in users document 
            res.send({url : url, success : "Url shortened successfully"});
         })
         .catch(err => {
             //Mostly occurs due to duplicate keygeneration
             console.log("url not created")
             res.status(400)
             res.send({"error" : "url not shortened, please try again"})
         })
        })    
});

function validateUrl(url){    
    return isUrlValid(url);
}

module.exports = router;

