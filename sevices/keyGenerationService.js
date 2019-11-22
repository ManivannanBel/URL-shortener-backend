const base64 = require("base-64");
const utf8 = require("utf8")
const mongoose = require("mongoose");

require("../models/Key");
const Key = mongoose.model("keys");

//var newKey;

async function generateKey(username, url){

    let key = await Key.findOneAndUpdate({ available: true }, {available : false}).exec();
    console.log(key);

    //console.log(key);
    if (key) {
      //Key.findOneAndUpdate({key : key}, {available : false});  
      return key.key;
    } else {
      //for uniqueness of the encoded string
      const stringCombination = url + username;
      const bytes = utf8.encode(stringCombination);
      const encoded = base64.encode(bytes);
      console.log(encoded);
      const startPos = Math.random() * (encoded.length - 6);
      const newKey = { 
          key : encoded.slice(startPos, startPos + 5),
          available : false
      }
      new Key(newKey)
      .save()
      .then(key => console.log("No key available in key collection, so new key generated.."))
      .catch(err => console.log("error in storing key in collection"))
      return newKey.key;
    }

}

module.exports = generateKey;