const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

//Load User model
require("../models/User");
const User = mongoose.model("users");

router.post("/register", (req, res) => {

    const {username, password, email} = req.body;
    const errors = {}

    if(!username)
        errors.username = "username should not be empty";
    if(!password)
        errors.password = "password should not be empty";
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
    new User(newUser)
      .save()
      .then(user => {
        res.send("CREATED");
      })
      .catch(err => console.log(err));

});

module.exports = router;