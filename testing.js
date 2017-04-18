
var mongojs = require("mongojs");
// Database configuration
var databaseUrl = "scraper";
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

var comment = {
    _id: String,
    comment: String
}

var articles = {
    _id: String,
    title: String,
    url: String,
    comments: {
        ref: comment,
        type: String
    }
}

var Comment = mongo
