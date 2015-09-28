/**
 * Created by arezki on 10/09/15.
 */
fs = require("fs")
var csv = require("csv");
var request = require("request");
var gcloud = require('gcloud')({
    projectId: 'gcdc2013-iogrow',
    keyFilename: "cridentials.json"
});
var async = require("async");
var gcs = gcloud.storage();
var bucket = gcs.bucket('gcdc2013-iogrow.appspot.com');
var listContactUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/contacts/listv2?alt=json";
var getContactUrl = "https://gcdc2013-iogrow.appspot.com/_ah/api/crmengine/v1/contacts/getv2?alt=json"
var outlookhead = ["First Name", "Middle Name", "Last Name", "Title", "Suffix", "Company", "Department", "Job Title", "Business Street", "Business Street 2", "Business Street 3", "Business City", "Business State", "Business Postal Code", "Business Country/Region", "Home Street", "Home Street 2", "Home Street 3", "Home City", "Home State", "Home Postal Code", "Home Country/Region", "Other Street", "Other Street 2", "Other Street 3", "Other City", "Other State", "Other Postal Code", "Other Country/Region", "Assistant's Phone", "Business Fax", "Business Phone", "Business Phone 2", "Callback", "Car Phone", "Company Main Phone", "Home Fax", "Home Phone", "Home Phone 2", "ISDN", "Mobile Phone", "Other Fax", "Other Phone", "Pager", "Primary Phone", "Radio Phone", "TTY/TDD Phone", "Telex", "Account", "Anniversary", "Assistant's Name", "Billing Information", "Birthday", "Business Address PO Box", "Categories", "Children", "Directory Server", "E-mail Address", "E-mail Type", "E-mail Display Name", "E-mail 2 Address", "E-mail 2 Type", "E-mail 2 Display Name", "E-mail 3 Address", "E-mail 3 Type", "E-mail 3 Display Name", "Gender", "Government ID Number", "Hobby", "Home Address PO Box", "Initials", "Internet Free Busy", "Keywords", "Language", "Location", "Manager's Name", "Mileage", "Notes", "Office Location", "Organizational ID Number", "Other Address PO Box", "Priority", "Private", "Profession", "Referred By", "Sensitivity", "Spouse", "User 1", "User 2", "User 3", "User 4", "Web Page"]
var baseUrl = "https://console.developers.google.com/m/cloudstorage/b/gcdc2013-iogrow.appspot.com/o/";
console.log("here");
function refrech_tab(tab, index) {
    for (var i = 1; i < tab.length; i++) {
        tab[i].splice(index, 0, "");
    }
}
function getInfonodes(infonodes, field) {
    var t = [];
    if (infonodes) {
        var rs = infonodes.items.filter(function (a) {
            return a.kind == field
        })
        if (rs.length) {
            var items = rs[0].items
            for (var i = 0; i < items.length; i++) {
                var fields = items[i].fields,
                    obj = {}
                for (var j = 0; j < fields.length; j++) {
                    obj[fields[j].field] = fields[j].value;
                }
                t.push(obj)
            }
        }
    }
    return t;
}
function getItem(params, url, access_token, callback) {
    request.post({
        url: url,
        json: params
    }, function (error, response, body) {
        callback(body)


    }).auth(null, null, true, access_token);

}
// ************************************ APIs core******************
exports.exportAllContact = function (params, CallBack, error) {
    var out = [outlookhead];
    var p = {order: "-updated_at", limit: 20 , tags:params.tags}
    var nextPageToken = "az";
    var file = bucket.file(params.fileName + ".csv");
    file.acl.add({
        scope: 'allUsers',
        role: gcs.acl.READER_ROLE
    }, function (err, aclObject, apiResponse) {
        //console.log(apiResponse);
    });
    var opts = {metadata: {cacheControl: "public, max-age=300"}}
    var remoteWriteStream = file.createWriteStream(opts);
    async.whilst(
        function () {
            return nextPageToken != undefined;
        },
        function (next) {

            request.post({url: listContactUrl, json: p}, function (error, response, body) {
                nextPageToken = body.nextPageToken;
                var i = 0
                async.whilst(
                    function () {
                        return i < body.items.length;
                    },
                    function (callback) {
                        var item = body.items[i]
                        var row = [];
                        for (var j = 0; j < outlookhead.length; j++) {
                            row.push("");
                        }
                        row[outlookhead.indexOf("First Name")] = item.firstname || ""
                        row[outlookhead.indexOf("Last Name")] = item.lastname || ""
                        row[outlookhead.indexOf("Title")] = item.title || ""
                        if (item.accounts)
                            row[outlookhead.indexOf("Company")] = item.accounts[0].name || "";

                        if (item.phones) {
                            var phones = item.phones.items
                            var index = outlookhead.indexOf("Mobile Phone")
                            row[index] = phones[0].number;
                            if (phones.length > 1) {

                                for (var k = 1; k < phones.length; k++) {
                                    //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                    if (outlookhead.indexOf("Mobile Phone " + k) > 0) {
                                        row[outlookhead.indexOf("Mobile Phone " + k)] = phones[k].number;
                                    } else {
                                        outlookhead.splice(index + k, 0, "Mobile Phone " + k);
                                        row.splice(index + k, 0, phones[k].number);
                                        refrech_tab(out, index + k)

                                    }
                                }
                            }
                        }
                        if (item.emails) {
                            var emails = item.emails.items
                            var index = outlookhead.indexOf("E-mail Address")
                            row[index] = emails[0].email;
                            if (emails.length > 1) {

                                for (var k = 1; k < emails.length; k++) {
                                    //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                    if (outlookhead.indexOf("E-mail " + k + " Address") > 0) {
                                        row[outlookhead.indexOf("E-mail " + k + " Address")] = emails[k].email;
                                    } else {
                                        outlookhead.splice(index + k, 0, "E-mail " + k + " Address");
                                        row.splice(index + k, 0, emails[k].email);
                                        refrech_tab(out, index + k)

                                    }
                                }
                            }
                        }
                        if (item.tags) {
                            var tags = item.tags;
                            for (var k = 0; k < tags.length; k++) {
                                //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                if (k != tags.length - 1) row[outlookhead.indexOf("Categories")] = row[outlookhead.indexOf("Categories")]
                                    + tags[k].name + "; ";
                                else row[outlookhead.indexOf("Categories")] = row[outlookhead.indexOf("Categories")]
                                    + tags[k].name;


                            }
                        }

                        var p = {
                            cases: {limit: "15"},
                            documents: {limit: "15"},
                            events: {},
                            id: item.id,
                            opportunities: {limit: "15"},
                            tasks: {},
                            topics: {limit: "7"}
                        }


                        getItem(p, getContactUrl, params.access_token,
                            function (resp) {
                                if (resp) {
                                    var websites = getInfonodes(resp.infonodes, 'websites');
                                    if (websites.length) {
                                        var index = outlookhead.indexOf("Web Page");
                                        row[index] = websites[0].url;
                                        if (websites.length > 1) {
                                            for (var k = 1; k < websites.length; k++) {
                                                //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                                row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")] + "\n Web Page :" + websites[k].url
                                            }
                                        }
                                    }
                                    var customfields = getInfonodes(resp.infonodes, 'customfields');
                                    console.log("********************");
                                    console.log(customfields)
                                    for (var k = 0; k < customfields.length; k++) {
                                        var o=customfields[k]
                                        //console.log(outlookhead.indexOf("E-mail " + k + " Address")) Custom Field 1 - Value
                                        if (outlookhead.indexOf("Custom Field " + (k + 1) + " - Value") > 0) {
                                            row[outlookhead.indexOf("Custom Field " + (k + 1) + " - Value")] = o[Object.keys(o)[0]];
                                            row[outlookhead.indexOf("Custom Field " + (k + 1) + " - Type")] = Object.keys(o)[0];
                                        } else {
                                            var index =outlookhead.push("Custom Field " + (k+1) + " - Value");
                                            row.splice(index-1, 0, o[Object.keys(o)[0]])
                                            console.log("Custom Field " + (k+1) + " - Value", o[Object.keys(o)[0]] , index)
                                            //refrech_tab(out, index -1)
                                            index =outlookhead.push("Custom Field " + (k+1) + " - Type");
                                            row.splice(index-1, 0, Object.keys(o)[0]);
                                            //refrech_tab(out, index -1)

                                        }
                                    }


                                    if (resp.addresses) {
                                        var addresses = resp.addresses.items;

                                        if (addresses.length) {
                                            var index = outlookhead.indexOf("Home Address");
                                            row[index] = addresses[0].formatted;
                                            if (addresses.length > 1) {
                                                for (var k = 1; k < addresses.length; k++) {
                                                    //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                                    row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")] + "\nHome Address :" + addresses[k].formatted
                                                }
                                            }
                                        }
                                    }
                                    if (resp.topics) {
                                        var notes = resp.topics.items;
                                        if (notes.length) {
                                            for (var k = 0; k < notes.length; k++) {
                                                //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                                row[outlookhead.indexOf("Notes")] = "Note Title: " + notes[k].title + ", Note Content :" + notes[k].excerpt
                                                    + ", Added by : " + notes[k].last_updater.display_name
                                                    + "\n" + row[outlookhead.indexOf("Notes")]

                                            }
                                        }
                                    }
                                    if (resp.opportunities) {
                                        var opportunities = resp.opportunities.items;
                                        if (opportunities.length) {

                                            for (var k = 0; k < opportunities.length; k++) {
                                                //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                                row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")] + "\n" +
                                                    "Opportunity Name: " + opportunities[k].name +
                                                    ", Opportunity Amount :" + opportunities[k].amount_total + " " + opportunities[k].currency
                                                    + ", Opportunity Stage :" + opportunities[k].current_stage.name
                                                    + ", Closed Date :" + opportunities[k].closed_date
                                                    + ", Created At :" + opportunities[k].created_at


                                            }
                                        }
                                    }
                                    if (resp.cases) {
                                        var cases = resp.cases.items;
                                        if (cases.length) {

                                            for (var k = 0; k < cases.length; k++) {
                                                //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                                row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")] + "\n" +
                                                    "Case Name: " + cases[k].name +
                                                    ", Case Priority :" + cases[k].priority
                                                    + ", Created At :" + cases[k].created_at
                                                    + ", Created By :" + cases[k].owner.google_display_name


                                            }
                                        }
                                    }
                                    if (resp.tasks) {
                                        var tasks = resp.tasks.items;
                                        if (tasks.length) {

                                            for (var k = 0; k < tasks.length; k++) {
                                                //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                                row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")]
                                                    + "\n"
                                                    + "Task Title: " + tasks[k].title
                                                    + ", Task Status :" + tasks[k].priority
                                                    + ", Created At :" + tasks[k].created_at
                                                    + ", Created By :" + tasks[k].created_by.display_name
                                                    + ", Due Date :" + tasks[k].due


                                            }
                                        }
                                    }
                                    if (resp.events) {
                                        var events = resp.events.items;
                                        if (events.length) {

                                            for (var k = 0; k < events.length; k++) {
                                                //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                                row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")]
                                                    + "\n"
                                                    + "Event Title: " + events[k].title
                                                    + ", Event Status :" + events[k].priority
                                                    + ", Start At :" + events[k].ends_at
                                                    + ", Created At :" + events[k].created_at
                                                    + ", End At :" + events[k].starts_at
                                                    + ", Hosted In :" + events[k].where


                                            }
                                        }
                                    }
                                }
                                callback()
                            }
                        );
                        out.push(row);
                        i++;
                    },
                    function (err) {
                        next();
                    }
                );

                p = {order: "-updated_at", limit: 1000, pageToken: nextPageToken}


            }).auth(null, null, true, params.access_token);
            //console.log("------->", nextPageToken);
        },
        function (err) {
            csv()
                .from(out)
                .to(remoteWriteStream);
            CallBack(baseUrl + params.fileName + ".csv?authuser=1");
            if (err) error(err);

        });

};
exports.exportContactByKeys = function (params, CallBack, error) {
    var out = [outlookhead];
    var file = bucket.file(params.fileName + ".csv");
    file.acl.add({
        scope: 'allUsers',
        role: gcs.acl.READER_ROLE
    }, function (err, aclObject, apiResponse) {
        //console.log(apiResponse);
    });
    var opts = {metadata: {cacheControl: "public, max-age=300"}}
    var remoteWriteStream = file.createWriteStream(opts);
    var i = 0
    var ids = eval(params.IDs)
    async.whilst(
        function () {
            return i < ids.length;
        },
        function (callback) {
            var id = ids[i]
            console.log(id);
            var row = [];
            for (var j = 0; j < outlookhead.length; j++) {
                row.push("");
            }


            var p = {
                cases: {limit: "15"},
                documents: {limit: "15"},
                events: {},
                id: id,
                opportunities: {limit: "15"},
                tasks: {},
                topics: {limit: "7"}
            }


            getItem(p, getContactUrl, params.access_token,
                function (resp) {
                    if (resp) {
                        row[outlookhead.indexOf("First Name")] = resp.firstname || ""
                        row[outlookhead.indexOf("Last Name")] = resp.lastname || ""
                        row[outlookhead.indexOf("Title")] = resp.title || ""
                        if (resp.accounts)
                            row[outlookhead.indexOf("Company")] = resp.accounts[0].name || "";

                        if (resp.phones) {
                            var phones = resp.phones.items
                            var index = outlookhead.indexOf("Mobile Phone")
                            row[index] = phones[0].number;
                            if (phones.length > 1) {

                                for (var k = 1; k < phones.length; k++) {
                                    //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                    if (outlookhead.indexOf("Mobile Phone " + k) > 0) {
                                        row[outlookhead.indexOf("Mobile Phone " + k)] = phones[k].number;
                                    } else {
                                        outlookhead.splice(index + k, 0, "Mobile Phone " + k);
                                        row.splice(index + k, 0, phones[k].number);
                                        refrech_tab(out, index + k)

                                    }
                                }
                            }
                        }
                        if (resp.emails) {
                            var emails = resp.emails.items
                            var index = outlookhead.indexOf("E-mail Address")
                            row[index] = emails[0].email;
                            if (emails.length > 1) {

                                for (var k = 1; k < emails.length; k++) {
                                    //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                    if (outlookhead.indexOf("E-mail " + k + " Address") > 0) {
                                        row[outlookhead.indexOf("E-mail " + k + " Address")] = emails[k].email;
                                    } else {
                                        outlookhead.splice(index + k, 0, "E-mail " + k + " Address");
                                        row.splice(index + k, 0, emails[k].email);
                                        refrech_tab(out, index + k)

                                    }
                                }
                            }
                        }
                        if (resp.tags) {
                            var tags = resp.tags;
                            for (var k = 0; k < tags.length; k++) {
                                //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                if (k != tags.length - 1) row[outlookhead.indexOf("Categories")] = row[outlookhead.indexOf("Categories")]
                                    + tags[k].name + "; ";
                                else row[outlookhead.indexOf("Categories")] = row[outlookhead.indexOf("Categories")]
                                    + tags[k].name;


                            }
                        }

                        var websites = getInfonodes(resp.infonodes, 'websites');
                        if (websites.length) {
                            var index = outlookhead.indexOf("Web Page");
                            row[index] = websites[0].url;
                            if (websites.length > 1) {
                                for (var k = 1; k < websites.length; k++) {
                                    //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                    row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")] + "\n Web Page :" + websites[k].url
                                }
                            }
                        }
                        if (resp.addresses) {
                            var addresses = resp.addresses.items;

                            if (addresses.length) {
                                var index = outlookhead.indexOf("Home Address");
                                row[index] = addresses[0].formatted;
                                if (addresses.length > 1) {
                                    for (var k = 1; k < addresses.length; k++) {
                                        //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                        row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")] + "\nHome Address :" + addresses[k].formatted
                                    }
                                }
                            }
                        }
                        if (resp.topics) {
                            var notes = resp.topics.items;
                            if (notes.length) {
                                for (var k = 0; k < notes.length; k++) {
                                    //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                    row[outlookhead.indexOf("Notes")] = "Note Title: " + notes[k].title + ", Note Content :" + notes[k].excerpt
                                        + ", Added by : " + notes[k].last_updater.display_name
                                        + "\n" + row[outlookhead.indexOf("Notes")]

                                }
                            }
                        }
                        if (resp.opportunities) {
                            var opportunities = resp.opportunities.items;
                            if (opportunities.length) {

                                for (var k = 0; k < opportunities.length; k++) {
                                    //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                    row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")] + "\n" +
                                        "Opportunity Name: " + opportunities[k].name +
                                        ", Opportunity Amount :" + opportunities[k].amount_total + " " + opportunities[k].currency
                                        + ", Opportunity Stage :" + opportunities[k].current_stage.name
                                        + ", Closed Date :" + opportunities[k].closed_date
                                        + ", Created At :" + opportunities[k].created_at


                                }
                            }
                        }
                        if (resp.cases) {
                            var cases = resp.cases.items;
                            if (cases.length) {

                                for (var k = 0; k < cases.length; k++) {
                                    //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                    row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")] + "\n" +
                                        "Case Name: " + cases[k].name +
                                        ", Case Priority :" + cases[k].priority
                                        + ", Created At :" + cases[k].created_at
                                        + ", Created By :" + cases[k].owner.google_display_name


                                }
                            }
                        }
                        if (resp.tasks) {
                            var tasks = resp.tasks.items;
                            if (tasks.length) {

                                for (var k = 0; k < tasks.length; k++) {
                                    //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                    row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")]
                                        + "\n"
                                        + "Task Title: " + tasks[k].title
                                        + ", Task Status :" + tasks[k].priority
                                        + ", Created At :" + tasks[k].created_at
                                        + ", Created By :" + tasks[k].created_by.display_name
                                        + ", Due Date :" + tasks[k].due


                                }
                            }
                        }
                        if (resp.events) {
                            var events = resp.events.items;
                            if (events.length) {

                                for (var k = 0; k < events.length; k++) {
                                    //console.log(outlookhead.indexOf("E-mail " + k + " Address"))
                                    row[outlookhead.indexOf("Notes")] = row[outlookhead.indexOf("Notes")]
                                        + "\n"
                                        + "Event Title: " + events[k].title
                                        + ", Event Status :" + events[k].priority
                                        + ", Start At :" + events[k].ends_at
                                        + ", Created At :" + events[k].created_at
                                        + ", End At :" + events[k].starts_at
                                        + ", Hosted In :" + events[k].where


                                }
                            }
                        }
                    }
                    callback()
                }
            );
            out.push(row);
            i++;
        },
        function (err) {
            csv()
                .from(out)
                .to(remoteWriteStream);
            CallBack(baseUrl + params.fileName + ".csv?authuser=1");
            if (err) error(err);

        }
    );


}

