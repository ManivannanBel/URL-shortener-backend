const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//User schema
const UserSchema = new Schema({
    username : {
        type: String,
        required: true,
        unique : true
    },
    email : {
        type: String,
        required: true
    },
    password : {
        type: String,
        required: true
    },
    date_created : {
        type: Date,
        default: Date.now
    },
    is_active : {
        type: Boolean,
        default: true
    },
    links_shortened : {
        type: Number,
        default: 0
    },
    shortened_urls : [ {type : Schema.Types.ObjectId, ref : "urls"} ],
    has_api : {
        type : Boolean,
        default : false
    }
});


mongoose.model("users", UserSchema);