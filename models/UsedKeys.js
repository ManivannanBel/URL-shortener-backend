const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UsedKeysSchema = new Schema({
    key : {
        type : String,
        required : true
    }
})

mongoose.model("usedKeys", UsedKeysSchema);