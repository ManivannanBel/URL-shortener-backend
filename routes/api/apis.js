const keyGeneration = require("../../sevices/keyGenerationService");
const isUrlValid = require("url-validation");
const urlExists = require("url-exists");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

//Load User model
require("../../models/User");
const User = mongoose.model("users");
//Load Url model
require("../../models/Url");
const Url = mongoose.model("urls");
//Load Key model
require("../../models/Key");
const Key = mongoose.model("keys");

router.post("/:id", (req, res) => {
  //const { url, id } = req.params;
  const url = req.body.url;
  const errors = {};

  if (!url) {
    errors.error = "Url should not be empty";
  }

  //console.log(checkIfUrlExists(url))

  if (!validateUrl(url)) {
    errors.error =
      "Enter the url in correct format, Eg: https://www.example.com or http://www.example.com";
  }

  if (Object.keys(errors).length !== 0) {
    res.status(400);
    res.send(errors);
    return;
  }

  //console.log(req.params.id)

  User.findOne({
    _id: req.params.id
  }).then(user => {
      //console.log("has api "+user.has_api);
    if (user.has_api) {
      //If the user has already shortened the url
      Url.findOne({
        original_url: url,
        user_id: req.params.id
      }).then(urlFound => {
        if (urlFound) {
          //If the user already has the url shortened then return the shortened link and and error msg
          const message = {}
            message.message = "You have shortened this url already";
            message.url = urlFound.shortened_url;
            //res.status(400);
            res.send(message);
          return;
        } else {
          //Else create a new shortened url and store it in db
          //Find the user exists
          User.findOne({
            _id: req.params.id
          })
          .then(user => {
            const currentDate = new Date();
              keyGeneration(req.params.id, url).then(key => {
                const newUrl = {
                  original_url: url,
                  shortened_url: key,
                  user_id: user._id,
                  is_api : true,
                  expiration_time : new Date().setFullYear(currentDate.getFullYear() + 1)
                };

                //console.log("new " + newUrl.shortened_url);
                //If the user exists, then create a new url
                new Url(newUrl)
                  .save()
                  .then(url => {
                    //Update the shortened_url reference in users document
                    user.shortened_urls.push(url._id);
                    user.links_shortened += 1;
                    user
                      .save()
                      .then(user => {
                        res.status(200);
                        res.send({ url : url.shortened_url});
                        return;
                      })
                      .catch(err =>
                        console.log("url id not updated in the user document")
                      );
                  })
                  .catch(err => {
                    //Mostly occurs due to duplicate keygeneration
                    console.log("url not created");
                    res.status(400);
                    res.send({ error: "url not shortened, please try again" });
                  });
              });
            })
            .catch(err => {
              res.status(404);
              res.send({ user: "user not found" });
            });
        }
      });
    } else {
      res.status(400);
      res.send({ error: "invalid api key" });
    }
  });

 // console.log(url);
});

router.delete("/:id", (req, res) => {
    const url = req.body.url;
    const {id} = req.params;
    
    const errors = {}

    if(!url){
        errors.url = "Url should not be empty";
    }

    if(Object.keys(errors).length !== 0){
        res.status(400)
        res.send(errors)
        return;
    }

    User.findOne({
        _id : id
    })
    .then(user => {
        if(user.has_api){
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
                                res.send("Url deleted");
                            })
                            .catch(err => console.log("Url deleted from URL model but not in user list"))
                    }else{
                        console.log("urlid and user's doesn't match")
                    }
                 })
             })
             .catch(err => {
                 res.status(404)
                 res.send({"url" : "url not found"})
             })
        }else{
            res.status(400);
            res.send({ error: "invalid api key" });
        }        
    })


})

function validateUrl(url){    
    return isUrlValid(url);
}

module.exports = router;

