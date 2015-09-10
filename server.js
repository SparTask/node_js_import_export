// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var request = require('request');
var api= require('./api')
var insertContactUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/contacts/insertv2?alt=json"
var access_token = "ya29.6QH6uof8ekUYyCA4popnPTIH_JYJfFhWX0WZ3vmxKN5p-xHdY_pbvhs_QKYCGlAq-T_U"

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});
// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.post('/import', function(req, res) {
    console.log(req.body);
    api.Import({},"e.glez.encinas@gmail.com_1440433224.48.csv",{0:"fr"},
        function(resultRow,rawRow,rowIndex) {
            var params = {
                access: "public",
                emails: [],
                firstname: "test",
                infonodes: [],
                lastname: "test",
                notes: [],
                phones: [],
            }
             console.log(rowIndex);
             request.post({url:insertContactUrl, json:params}, function (error, response, body) {



                }).auth(null, null, true, access_token);
            res.json({message: rowIndex, params: req.body});
        },
        function(){
            res.json({message: "end", params: req.body});
        });



});
router.post('/export', function(req, res) {
    res.json({ message: 'export api' });
});

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
// more routes for our API will happen here