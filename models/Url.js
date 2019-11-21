const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//URL Schema
const UrlSchema = new Schema({

    shortened_url : {
        type : String,
        required : true
    },
    original_url : {
        type : String,
        required : true
    },
    creation_time : {
        type : Date,
        default : Date.now
    },
    expiration_time : {
        type : Date 
    },
    user_id : {
        type : Schema.Types.ObjectId,
        required : true,
        ref : "users"
    },
    no_of_redirections : {
        type : Number,
        default : 0
    }
});

mongoose.model("urls", UrlSchema);