const express = require("express");
const subdomain = require("express-subdomain");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");

const app = express();

app.use(cors());


//Connect to mongoose
const keys = require("./config/keys");
mongoose
  .connect(keys.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch(err => console.log(err));

//Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Passport middleware
app.use(passport.initialize());

//passport config
require("./config/passport")(passport);

//user route
app.use("/user/", require("./routes/user/users"));
//url route
app.use("/url/", require("./routes/urls"));
//api route
app.use("/api/", require("./routes/api/apis"));

//Load User model
require("./models/User");
const User = mongoose.model("users");
//Load Url model
require("./models/Url");
const Url = mongoose.model("urls");
//Load Key model
require("./models/Key");
const Key = mongoose.model("keys");

app.get("/:key", (req, res) => {
  const { key } = req.params;
  //console.log(key);
  Url.findOne({ shortened_url: key })
    .then(url => {
      //console.log(url.creation_time + " < " + url.expiration_time +" = "+ (url.creation_time < url.expiration_time))
      if (!url) {
        res.send("Url may be expired");
      } else {
        //Check if the url is expired
        if (url.creation_time < url.expiration_time) {
          //console.log(url.original_url)

          res.redirect(url.original_url);
          url.no_of_redirections = url.no_of_redirections + 1;
          url.save();
        } else {
          //console.log(url.original_url)
          const key = url.shortened_url;
          const user_id = url.user_id;
          const url_id = url._id;
          url
            .remove()
            .then(() => {
              Key.findOne({ key })
                .then(k => {
                  k.available = true;
                  k.save();
                })
                .catch(err => {
                  console.log(
                    "short url deleted but failed to update the key table"
                  );
                });
              User.findOne({ _id: user_id })
                .then(u => {
                  //console.log(u);
                  u.shortened_urls = u.shortened_urls.filter(
                    u_id => !u_id.equals(url_id)
                  );
                  u.save();
                })
                .catch(err => {
                  console.log(
                    "short url deleted, key restored, but not updated on user table"
                  );
                });
            })
            .catch(err => {
              console.log("short url not deleted");
            });
          res.send("Url may be expired");
        }
      }
    })
    .catch(err => {
      console.log(err);
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, function() {
  console.log("Server listening to port 5000");
});
