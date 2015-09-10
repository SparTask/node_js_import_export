fs = require("fs")
fastCsv = require("fast-csv")

var gcloud = require('gcloud')({
    projectId: 'gcdc2013-iogrow',
    keyFilename: "cridentials.json"
});
var Converter = require("csvtojson").Converter;
var gcs = gcloud.storage()
var backups = gcs.bucket('gcdc2013-iogrow.appspot.com');
//var insertContactUrl = "http://localhost:8090/_ah/api/crmengine/v1/contacts/insertv2?alt=json"

//var access_token = "ya29.6gHU9LqUTZp4e_VdorIB3xRUHQ6M3SYIForWXLdOzGWwFScoiDR0p-MAtq8qGKRC5IaA"

exports.Import = function (params, file, map, callback , end ) {
    var fileStream = backups.file(file).createReadStream();
    var converter = new Converter({constructResult: false});
//end_parsed will be emitted once parsing finished
    converter.on("end_parsed", end);
    converter.on("record_parsed", callback);
    fileStream.pipe(converter);
}
