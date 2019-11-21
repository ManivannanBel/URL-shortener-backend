const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

//Connect to mongoose
mongoose.connect('mongodb://localhost/shortener-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
 .then(() => {console.log("MongoDB connected")})
 .catch(err => console.log(err));

//Load User model
require("./models/User");
const User = mongoose.model("users");
//Load Url model
require("./models/Url");
const Url = mongoose.model("urls");

//Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post("/register", (req, res) => {

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

app.post("/url/:id", (req, res) => {

    const {url} = req.body;
    const errors = {}

    if(!url){
        errors.url = "Url should not be empty";
    }

    if(Object.keys(errors).length !== 0){
        res.status(400);
        res.send(errors);
        return;
    }

    User.findOne({
        _id : req.params.id
    })
     .then(user => {
        const newUrl = {
            original_url : url,
            shortened_url : "shortened",
            user_id : user._id
        }
        new Url(newUrl)
         .save()
         .then(url => {
            user.shortened_urls.push(url._id)
            user.save()
                .then(user => {
                    res.status(200);
                    res.send("Created");
                    return;
                })
                .catch(err => console.log("url id not updated in the user document"))
         })
         .catch(err => console.log("url not created"))
     })
     .catch(err => {
         res.status(404);
         res.send({"user":"user not found"})
     })
});

app.delete("/url/:id", (req, res) => {
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
         console.log("url found "+ urlId)
         User.findOne({
            _id : id
         })
         .then(user => {
            if(user.shortened_urls.includes(urlId)){
                url.remove()
                user.shortened_urls = user.shortened_urls.filter(url => url === urlId)
                console.log(user.shortened_urls)
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

app.get("/", (req, res)=>{
    res.send("Hello");
})

const server = app.listen(5000, function(){
    console.log("Server listening to port 5000")
})

