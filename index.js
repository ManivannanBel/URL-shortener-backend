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
app.use(bodyParser.json());

//user route
app.use("/user/", require("./routes/users"));
//url route
app.use("/url/", require("./routes/urls"));

const server = app.listen(5000, function(){
    console.log("Server listening to port 5000")
})

