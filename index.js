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

//Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

//user route
app.use("/user/", require("./routes/user/users"));
//url route
app.use("/url/", require("./routes/urls"));
//api route
app.use("/api/", require("./routes/api/apis"));

const server = app.listen(5000, function(){
    console.log("Server listening to port 5000")
})

