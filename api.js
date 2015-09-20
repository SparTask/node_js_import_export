fs = require("fs")

var gcloud = require('gcloud')({
    projectId: 'gcdc2013-iogrow',
    keyFilename: "cridentials.json"
});
var Iconv = require('iconv').Iconv;
var iconvLite = require('iconv-lite');
var Converter = require("csvtojson").Converter;
var gcs = gcloud.storage()
var backups = gcs.bucket('gcdc2013-iogrow.appspot.com');
var _this= this;

//var insertContactUrl = "http://localhost:8090/_ah/api/crmengine/v1/contacts/insertv2?alt=json"

//var access_token = "ya29.6gHU9LqUTZp4e_VdorIB3xRUHQ6M3SYIForWXLdOzGWwFScoiDR0p-MAtq8qGKRC5IaA"

exports.Import = function (params, file, map, callback , end ) {
    var fileStream = backups.file(file).createReadStream();
    var converter = new Converter({constructResult: false});
    var csvConv = new Iconv('cp1252', 'utf-8');
    var asciConv = new Iconv('ISO-8859-1', 'utf-8');
    // var csvConv = new Iconv('cp1252', 'utf-8');
//end_parsed will be emitted once parsing finished
    converter.on("end_parsed", end);
    converter.on("record_parsed", callback);
    fileStream.pipe(iconvLite.decodeStream('win1252')).pipe(converter);
}
exports.isEmpty = function(obj) {
    return Object.keys(obj).length === 0;
}
exports.getDefaultFields = function(){
	return {
	    'phones' : {'default_field' : 'number'},
	    'emails' : {'default_field' : 'email'},
	    'addresses' : {'default_field' : 'formatted'},
	    'sociallinks' : {'default_field' : 'url'},
	    'websites' : {'default_field' : 'url'}
	}
}
exports.constructInfoNode = function(obj){
	var infoNode = {};
	var defaultFields = _this.getDefaultFields();
	for (var key in obj){
		infoNode['kind']=key;
		infoNode['fields']=[];
		var defaultField = defaultFields[key]['default_field'];
		if (typeof(obj[key])=='object'){
			for (var i in obj[key]){
				var field = {};
				field['field']=defaultField;
				field['value']=obj[key][i];
				if (!(_this.isEmpty(field))){
					infoNode['fields'].push(field);
				}
			}
		}else{
			var field = {};
			field['field']=defaultField;
			field['value']=obj[key];
			if (!(_this.isEmpty(field))){
				infoNode['fields'].push(field);
			}
		}
	}
	return infoNode;
}
exports.constructCustomField = function(obj){
	var customField = {};
	for (var key in obj){
		customField['kind']='customfields';
		customField['fields']=[];
		if (typeof(obj[key])=='object'){
			for (var i in obj[key]){
				var field = {};
				field['field']=key;
				field['value']=obj[key][i];
				if (!(_this.isEmpty(field))){
					customField['fields'].push(field);
				}
			}
		}else{
			var field = {};
			field['field']=key;
			field['value']=obj[key];
			if (!(_this.isEmpty(field))){
				customField['fields'].push(field);
			}
		}
	}
	return customField;
}

exports.getInfoNodes = function(params){
	var infoNodes = [];
	var defaultFields = _this.getDefaultFields();
	for (var attr in params){
		if (defaultFields.hasOwnProperty(attr)){
			var obj={};
			obj[attr]=params[attr];
			infoNodes.push(_this.constructInfoNode(obj));
		}else if(attr=='customFields'){
			var obj={};
			obj[params[attr]['default_field']]=params[attr]['value'];
			var customFieldObj = _this.constructCustomField(obj);
			if (!(_this.isEmpty(customFieldObj.fields))){
				infoNodes.push(customFieldObj);
			}
			
		}
	}
	return infoNodes;
}

exports.exportContact=function(){

};
