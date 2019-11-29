const express = require("express");
const subdomain = require('express-subdomain');
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");

const app = express();

app.use(cors())

//Connect to mongoose
mongoose.connect('mongodb://localhost/shortener-db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
 .then(() => {console.log("MongoDB connected")})
 .catch(err => console.log(err));

//Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

//Passport middleware
app.use(passport.initialize());

//passport config
require('./config/passport')(passport);

//user route
app.use("/user/", require("./routes/user/users"));
//url route
app.use("/url/", require("./routes/urls"));
//api route
app.use("/api/", require("./routes/api/apis"));

const server = app.listen(5000, function(){
    console.log("Server listening to port 5000")
})

