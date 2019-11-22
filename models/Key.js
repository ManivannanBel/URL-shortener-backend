const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const KeySchema = new Schema({
    key : {
        type : String,
        required : true,
        unique : true
    },
    available : {
        type : Boolean,
        required : true
    }
})

mongoose.model("keys", KeySchema);