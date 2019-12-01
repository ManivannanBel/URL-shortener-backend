const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//URL Schema
const UrlSchema = new Schema({

    shortened_url : {
        type : String,
        required : true,
        unique : true
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
        ref : "users"
    },
    no_of_redirections : {
        type : Number,
        default : 0
    },
    is_api : {
        type : Boolean,
        default : false
    }
});

mongoose.model("urls", UrlSchema);