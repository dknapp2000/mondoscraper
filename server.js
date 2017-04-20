/* Scraping into DB (18.2.5)
 * ========================== */
var path = require( "path" );
// Dependencies
var express = require("express");
var mongojs = require("mongojs");
var ObjectID = require("mongodb").ObjectID;
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");
var bodyParser = require( "body-parser" );

let commentId = 0;

// Initialize Express
var app = express();
// mongodb://dknapp:mongo@ds111441.mlab.com:11441/heroku_x3lz038m

// Database configuration
var databaseUrl = "scraper";
var databaseUrl = 'mongodb://dknapp:mongo@ds111441.mlab.com:11441/heroku_x3lz038m';
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text());
app.use(bodyParser.json({ type: "application/vnd.api+json" }));

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
    console.log( path.join( __dirname, "./index.html" ) );
  res.sendFile( path.join( __dirname, "./index.html" ));
});

app.post( "/comment/:id", function( req, res ) {
    let id = req.params.id;
    console.log( req.body );
    let commentText = req.body.text;
    console.log( "Commenting on article id: ", id );

    db.scrapedData.update(  { '_id': mongojs.ObjectId( id ) },
                            { $set: { "comment": commentText }},
                            function(err, resp) {
                                res.status(200).json( resp )
                            });
});

app.delete( "/uncomment/:id", function( req, res ) {
    let id = req.params.id;
    console.log( "Removing comment for id = " + id );
    db.scrapedData.update(  { '_id': mongojs.ObjectId( id ) },
                            { $set: { "comment": "" }},
                            function(err, resp) {
                                res.status(200).json( resp )
                            });
});

app.get( "/remove/:id", function( req, res ) {
    id = req.params.id;
    console.log( "Removing article id :", id );
    db.scrapedData.remove( { '_id': mongojs.ObjectId( id )},
        function( err, resp ) {
            res.redirect( "http://localhost:3000" );
        });
})

// Retrieve data from the db
app.get("/all", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as a json
    else {
      res.json(found);
      //console.log( found );
    }
  });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
    var seq = 0;
  // Make a request for the news section of ycombinator
  request("https://news.ycombinator.com/", function(error, response, html) {
    // Load the html body from request into cheerio
    var $ = cheerio.load(html);
    // For each element with a "title" class
    $(".title").each(function(i, element) {
      // Save the text of each link enclosed in the current element
      var title = $(this).children("a").text();
      // Save the href value of each link enclosed in the current element
      var link = $(this).children("a").attr("href");

      // If this title element had both a title and a link
      if (title && link) {
        // Save the data in the scrapedData db
        db.scrapedData.save({
          title: title,
          link: link,
          seq: seq++,
          comments: []
        },
        function(error, saved) {
          // If there's an error during this query
          if (error) {
            // Log the error
            console.log(error);
          }
          // Otherwise,
          else {
            // Log the saved data
            console.log(saved);
          }
        });
      }
    });
  });

  // This will send a "Scrape Complete" message to the browser
  res.send("Scrape Complete");
});


// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
