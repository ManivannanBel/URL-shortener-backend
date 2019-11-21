const base64 = require("base-64");
const utf8 = require("utf8")

function generateKey(username, url){
    //for uniqueness of the encoded string
    const stringCombination = url+username;
    const bytes = utf8.encode(stringCombination)
    const encoded = base64.encode(bytes)
    //console.log(encoded)
    const startPos = Math.random() * (encoded.length - 6);
    return encoded.slice(startPos, startPos + 5);
}

module.exports = generateKey;