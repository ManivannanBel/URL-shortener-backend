const keyGeneration = require("../sevices/keyGenerationService")
const isUrlValid = require("url-validation");
const urlExists = require("url-exists");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

//Load User model
require("../models/User");
const User = mongoose.model("users");
//Load Url model
require("../models/Url");
const Url = mongoose.model("urls");

router.post("/:id", (req, res) => {

    const {url} = req.body;
    const errors = {}

    if(!url){
        errors.error = "Url should not be empty";
    }

    //console.log(checkIfUrlExists(url))

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
        user_id : req.params.id
    })
    .then(urlFound => {
        if(urlFound){    //If the user already has the url shortened then return the shortened link and and error msg
            errors.error = "You have shortened this url already";
            errors.url = urlFound.shortened_url;
            res.status(400);
            res.send(errors);
            return;
        }else{  //Else create a new shortened url and store it in db
            //Find the user exists
    User.findOne({
        _id : req.params.id
    })
     .then(user => {
        const newUrl = {
            original_url : url,
            shortened_url : keyGeneration(req.params.id, url),
            user_id : user._id
        }
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
                    res.send({"url" : url.shortened_url});
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
     .catch(err => {
         res.status(404);
         res.send({"user":"user not found"})
     })
        }
    })

    console.log(url)
    
});

router.delete("/:id", (req, res) => {
    const {id} = req.params;
    const {url} = req.body;

    const errors = {}

    if(!url){
        errors.url = "Url should not be empty";
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
                url.remove()
                user.shortened_urls = user.shortened_urls.filter(url => url === urlId)
                user.links_shortened -= 1
                //console.log(user.shortened_urls)
                user.save()
                    .then(user => {
                        res.send("Url deleted");
                    })
                    .catch(err => console.log("Url deleted from URL model but not in user list"))
            }
         })
     })
     .catch(err => {
         res.status(404)
         res.send({"url" : "url not found"})
     })
})

function validateUrl(url){    
    return isUrlValid(url);
}

module.exports = router;

