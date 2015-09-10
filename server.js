// server.js

// BASE SETUP
// =============================================================================
var Iconv = require('iconv').Iconv;
// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var request = require('request');
var iconv = require('iconv-lite');
var api = require('./api');
var ExportApi = require('./exportApi');
var utf8 = require('utf8');
var insertLeadEndpoint = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/leads/insertv2?alt=json"
var insertContactEndpoint = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/contacts/insertv2?alt=json"
var insertAccountEndpoint = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/accounts/insert?alt=json"
// var insertLeadEndpoint = "http://localhost:8090/_ah/api/crmengine/v1/leads/insertv2?alt=json"
var listContactUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/contacts/listv2?alt=json";
var listLeadUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/leads/listv2?alt=json";
var listAccountUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/accounts/listv2?alt=json";
var getContactUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/contacts/getv2?alt=json"
var getLeadUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/leads/getv2?alt=json"
var getAccountUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/accounts/getv2?alt=json"
var getOppoUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/opportunities/getv2?alt=json"
var listOppoUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/opportunities/listv2?alt=json"
var getCaseUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/cases/getv2?alt=json"
var listCaseUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/cases/listv2?alt=json"
var getTaskUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/tasks/"
var listTaskUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/tasks/listv2?alt=json"

var importCompletedEndpoint = "https://gcdc2013-iogrow.appspot.com/jj"
var exportCompletedEndpoint = "https://gcdc2013-iogrow.appspot.com/exportcompleted"
// var importCompletedEndpoint = "http://localhost:8090/jj"


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
    res.json({message: 'hooray! welcome to our api!'});
});
// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.post('/import_leads', function (req, res) {
    var jdata = JSON.parse(Object.keys(req.body)[0]);
    var customFields = jdata['customfields_columns'];
    var matchedColumns = jdata['matched_columns'];
    var fullFilePath = jdata['file_path'];
    var splitter = fullFilePath.split('/gcdc2013-iogrow.appspot.com/');
    var filePath = splitter[1];

    api.Import({}, filePath, {0: "fr"},
        function (resultRow, rawRow, rowIndex) {
            var params = {'access': 'public'};
            for (var key in matchedColumns) {
                if (rawRow[key]) {
                    if (params.hasOwnProperty(matchedColumns[key])) {
                        if (typeof(params[matchedColumns[key]]) == 'object') {
                            params[matchedColumns[key]].push(rawRow[key]);
                        } else {
                            var newList = [];
                            newList.push(params[matchedColumns[key]]);
                            newList.push(rawRow[key]);
                            params[matchedColumns[key]] = newList;
                        }
                    }
                    else {
                        params[matchedColumns[key]] = rawRow[key];
                    }
                }
            }
            for (var key in customFields) {
                if (rawRow[key]) {
                    var customObj = {};
                    if (params.hasOwnProperty(customFields[key])) {
                        if (typeof(params[customFields[key]]) == 'object') {
                            customObj['default_field'] = customFields[key]
                            customObj['value'] = rawRow[key]
                            params['customFields'].push(customObj);
                        } else {
                            var newList = [];
                            customObj['default_field'] = customFields[key]
                            customObj['value'] = rawRow[key]
                            newList['customFields'].push(customObj);
                            params['customFields'] = newList;
                        }
                    }
                    else {
                        customObj['default_field'] = customFields[key]
                        customObj['value'] = rawRow[key]
                        params['customFields'] = customObj;
                    }
                }
            }
            params.infonodes = api.getInfoNodes(params);
            delete params.emails;
            delete params.phones;
            delete params.addresses;
            console.log(params);
            request.post({url: insertLeadEndpoint, json: params}, function (error, response, body) {
            }).auth(null, null, true, jdata['token']);
        },
        function () {
            var params = {'job_id': jdata['job_id']};
            request.post({url: importCompletedEndpoint, json: params}, function (error, response, body) {
            });
            res.json({message: 'imort api'});
        });
    res.json({message: 'imort api'});
});

router.post('/import_contacts', function (req, res) {
    var jdata = JSON.parse(Object.keys(req.body)[0]);
    var customFields = jdata['customfields_columns'];
    var matchedColumns = jdata['matched_columns'];
    var fullFilePath = jdata['file_path'];
    var splitter = fullFilePath.split('/gcdc2013-iogrow.appspot.com/');
    var filePath = splitter[1];
    api.Import({}, filePath, {0: "fr"},
        function (resultRow, rawRow, rowIndex) {
            var params = api.prepareParams(rawRow, matchedColumns, customFields);
            request.post({url: insertContactEndpoint, json: params}, function (error, response, body) {
            }).auth(null, null, true, jdata['token']);
        },
        function () {
            var params = {'job_id': jdata['job_id']};
            request.post({url: importCompletedEndpoint, json: params}, function (error, response, body) {
            });
            res.json({message: 'imort api'});
        });
    console.log('import res');
    res.json({message: 'imort api'});
});
router.post('/import_accounts', function (req, res) {
    var jdata = JSON.parse(Object.keys(req.body)[0]);
    var customFields = jdata['customfields_columns'];
    var matchedColumns = jdata['matched_columns'];
    var fullFilePath = jdata['file_path'];
    var splitter = fullFilePath.split('/gcdc2013-iogrow.appspot.com/');
    var filePath = splitter[1];
    api.Import({}, filePath, {0: "fr"},
        function (resultRow, rawRow, rowIndex) {
            var params = api.prepareParams(rawRow, matchedColumns, customFields);
            request.post({url: insertAccountEndpoint, json: params}, function (error, response, body) {
            }).auth(null, null, true, jdata['token']);
        },
        function () {
            var params = {'job_id': jdata['job_id']};
            request.post({url: importCompletedEndpoint, json: params}, function (error, response, body) {
            });
            res.json({message: 'imort api'});
        });
    console.log('import res');
    res.json({message: 'imort api'});
});

router.get('/json', function (req, res) {
    var filePath = 'google (7).csv - google (7).csv.csv';
    api.Import({}, filePath, {0: "fr"},
        function (resultRow, rawRow, rowIndex) {
            console.log(rawRow);
        },
        function () {
            console.log('completed');
        });
    res.json({message: 'export api'});
});

router.post('/export_contact', function (req, res) {
    //var params = req.body
    console.log(Object.keys(req.body)[0]);
    var params = req.body
    console.log(typeof  params);
    params.listUrl = listContactUrl;
    params.getUrl = getContactUrl;
    params.tab = 'contact'
    console.log(params);
    ExportApi.exportAll(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab
        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});
        log("completed for ",p.email)

    }, function () {
        res.json({message: 'error'});
    });
        res.json({})
});
router.post('/export_lead', function (req, res) {
    var params = req.body
    params.listUrl = listLeadUrl;
    params.getUrl = getLeadUrl;
    params.tab = 'lead'
    console.log(params);
    ExportApi.exportAll(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab

        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});
        log("completed for ",p.email)
    }, function () {
        res.json({message: 'error'});
    });
    res.json({})

});
router.post('/export_account', function (req, res) {
    var params = req.body
    console.log(typeof  params);
    params.listUrl = listAccountUrl;
    params.getUrl = getAccountUrl;
    params.tab = 'account'
    console.log(params);
    ExportApi.exportAll(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab

        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});

    }, function () {
        res.json({message: 'error'});
    });
    res.json({})
});
router.post('/export_contact_by_key', function (req, res) {
    var params = req.body
    params.listUrl = listContactUrl;
    params.getUrl = getContactUrl;
    params.tab = 'contact'
    console.log(typeof  params);
    ExportApi.exportByKeys(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab
        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});
    }, function (error) {
        res.json({message: "error"});
    });
    res.json({})

});
router.post('/export_lead_by_key', function (req, res) {
    var params = req.body
    params.listUrl = listLeadUrl;
    params.getUrl = getLeadUrl;
    params.tab = 'lead'
    console.log(typeof  params);
    ExportApi.exportByKeys(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab
        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});
    }, function (error) {
        res.json({message: "error"});
    });
    res.json({})

});
router.post('/export_account_by_key', function (req, res) {
    var params = req.body
    params.listUrl = listAccountUrl;
    params.getUrl = getAccountUrl;
    params.tab = 'account'
    console.log(typeof  params);
    ExportApi.exportByKeys(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab
        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});
    }, function (error) {
        res.json({message: "error"});
    });
    res.json({})

});
router.post('/export_opportunity', function (req, res) {
    var params = req.body
    params.listUrl = listOppoUrl;
    params.getUrl = getOppoUrl;
    params.tab = 'opportunity'
    console.log(typeof  params);
    ExportApi.exportOpportunity(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab
        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});
    }, function (error) {
        res.json({message: "error"});
    });
    //res.json({})

});
router.post('/export_opportunity_by_key', function (req, res) {
    var params = req.body
    params.listUrl = listOppoUrl;
    params.getUrl = getOppoUrl;
    params.tab = 'opportunity'
    console.log(typeof  params);
    ExportApi.exportOpportunityByKeys(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab
        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});
    }, function (error) {
        res.json({message: "error"});
    });
    //res.json({})

});
// more routes for our API will happen here
router.post('/export_case', function (req, res) {
    var params = req.body
    params.listUrl = listCaseUrl;
    params.getUrl = getCaseUrl;
    params.tab = 'case'
    console.log(typeof  params);
    ExportApi.exportCase(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab
        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});
    }, function (error) {
        res.json({message: "error"});
    });
    //res.json({})

});
router.post('/export_case_by_key', function (req, res) {
    var params = req.body
    params.listUrl = listCaseUrl;
    params.getUrl = getCaseUrl;
    params.tab = 'case'
    console.log(typeof  params);
    ExportApi.exportCaseByKeys(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab
        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});
    }, function (error) {
        res.json({message: "error"});
    });
    //res.json({})

});
router.post('/export_task', function (req, res) {
    var params = req.body
    params.listUrl = listTaskUrl;
    params.getUrl = getTaskUrl;
    params.tab = 'task'
    console.log(typeof  params);
    ExportApi.exportTask(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab
        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});
    }, function (error) {
        res.json({message: "error"});
    });
    //res.json({})

});
router.post('/export_task_by_key', function (req, res) {
    var params = req.body
    params.listUrl = listTaskUrl;
    params.getUrl = getTaskUrl;
    params.tab = 'task'
    console.log(params);
    ExportApi.exportTaskByKeys(params, function (fileUrl) {
        var p = {
            message: 'OK',
            downloadUrl: fileUrl,
            email: params.email,
            tab: params.tab
        }
        request.post({url: exportCompletedEndpoint, json: p}, function (error, response, body) {
        });
        res.json({message: 'export completed', p: p});
    }, function (error) {
        res.json({message: "error"});
    });
    //res.json({})

});


// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
// more routes for our API will happen here
