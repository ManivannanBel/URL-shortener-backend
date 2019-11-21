const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UnusedKeysSchema = new Schema({
    key : {
        type : String,
        required : true
    }
})

mongoose.model("unusedKeys", UnusedKeysSchema);