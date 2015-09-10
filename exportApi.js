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
var outlookhead = ["First Name", "Middle Name", "Last Name", "Title", "Suffix", "Company", "Department", "Job Title", "Business Street", "Business Street 2", "Business Street 3", "Business City", "Business State", "Business Postal Code", "Business Country/Region", "Home Street", "Home Street 2", "Home Street 3", "Home City", "Home State", "Home Postal Code", "Home Country/Region", "Other Street", "Other Street 2", "Other Street 3", "Other City", "Other State", "Other Postal Code", "Other Country/Region", "Assistant's Phone", "Business Fax", "Business Phone", "Business Phone 2", "Callback", "Car Phone", "Company Main Phone", "Home Fax", "Home Phone", "Home Phone 2", "ISDN", "Mobile Phone", "Other Fax", "Other Phone", "Pager", "Primary Phone", "Radio Phone", "TTY/TDD Phone", "Telex", "Account", "Anniversary", "Assistant's Name", "Billing Information", "Birthday", "Business Address PO Box", "Categories", "Children", "Directory Server", "E-mail Address", "E-mail Type", "E-mail Display Name", "E-mail 2 Address", "E-mail 2 Type", "E-mail 2 Display Name", "E-mail 3 Address", "E-mail 3 Type", "E-mail 3 Display Name", "Gender", "Government ID Number", "Hobby", "Home Address PO Box", "Initials", "Internet Free Busy", "Keywords", "Language", "Location", "Manager's Name", "Mileage", "Notes", "Office Location", "Organizational ID Number", "Other Address PO Box", "Priority", "Private", "Profession", "Referred By", "Sensitivity", "Spouse", "User 1", "User 2", "User 3", "User 4", "Web Page"]
var oppohead = ["Name", "Amount Per Unit","Current Stage", "Category", "Need", "Company", "Created At", "Closed At", "Decission Process", "Related Contact", "Opportunity Type", "Note", "Costum Field", "Time scale", "Competitor", "Currency", "Total Amount", "Event", "Task"]
var baseUrl = "https://console.developers.google.com/m/cloudstorage/b/gcdc2013-iogrow.appspot.com/o/";
var casehead = ["Case Title", "Case Status", "Case Priority", "Description", "Category", "Related Account", "Related Contact", "Task", "Event"];
var taskhead = ["Task Title", "Task Status Label", "Task Status", "Related To", "Opened By", "Category", "Assignees To", "Created At", "Due Date"];
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
                if(fields!=undefined)
                for (var j = 0; j < fields.length; j++) {
                    obj[fields[j].field] = fields[j].value;
                }
                t.push(obj)
            }
        }
    }
    return t;
}
function defObj(item) {
    if (item) return item
    else return {}
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
exports.exportAll = function (params, CallBack, error) {
    var out = [outlookhead];
    var p = {order: "-updated_at", limit: 100, tags: params.tags}
    var nextPageToken = "az";
    var file = bucket.file(params.fileName + "_" + params.tab + ".csv");
    file.acl.add(
        {
            "entity": params.email,
            "role": gcs.acl.OWNER_ROLE,
            "generation": "1"
        }
        , function (err, aclObject, apiResponse) {
        
        });
    var opts = {metadata: {cacheControl: "public, max-age=300"}}
    var remoteWriteStream = file.createWriteStream(opts);
    console.log(params);
    async.whilst(
        function () {
            return nextPageToken != undefined;
        },
        function (next) {

            request.post({url: params.listUrl, json: p}, function (error, response, body) {
                nextPageToken = body.nextPageToken;
                var i = 0;
                if (body.items != undefined) {

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
                        if (item.name) row[outlookhead.indexOf("Company")] = item.name || ""
                        if (item.company) row[outlookhead.indexOf("Company")] = item.company || ""
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
                        console.log(item.id);


                        getItem(p, params.getUrl, params.access_token,
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
                                    for (var k = 0; k < customfields.length; k++) {
                                        var o = customfields[k]
                                        //console.log(outlookhead.indexOf("E-mail " + k + " Address")) Custom Field 1 - Value
                                        if (outlookhead.indexOf("Custom Field " + (k + 1) + " - Value") > 0) {
                                            row[outlookhead.indexOf("Custom Field " + (k + 1) + " - Value")] = o[Object.keys(o)[0]];
                                            row[outlookhead.indexOf("Custom Field " + (k + 1) + " - Type")] = Object.keys(o)[0];
                                        } else {
                                            var index = outlookhead.push("Custom Field " + (k + 1) + " - Value");
                                            row.splice(index - 1, 0, o[Object.keys(o)[0]])
                                            console.log("Custom Field " + (k + 1) + " - Value", o[Object.keys(o)[0]], index)
                                            //refrech_tab(out, index -1)
                                            index = outlookhead.push("Custom Field " + (k + 1) + " - Type");
                                            row.splice(index - 1, 0, Object.keys(o)[0]);
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
                                                    + ", Opportunity Stage :" + defObj(opportunities[k].current_stage).name
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
            }else next();

                p = {order: "-updated_at", limit: 100, pageToken: nextPageToken, tags: params.tags}


            }).auth(null, null, true, params.access_token);
            //console.log("------->", nextPageToken);
        },
        function (err) {
            csv()
                .from(out)
                .to(remoteWriteStream);
            CallBack(baseUrl + params.fileName + "_" + params.tab + ".csv?authuser=1");
            if (err) error(err);

        });

};
exports.exportByKeys = function (params, CallBack, error) {
    var out = [outlookhead];
    var file = bucket.file(params.fileName + "_" + params.tab + ".csv");
    file.acl.add(
        {
            "entity": params.email,
            "role": gcs.acl.OWNER_ROLE,
            "generation": "1"
        }
        , function (err, aclObject, apiResponse) {
            console.log(apiResponse);
            console.log(err);
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


            getItem(p, params.getUrl, params.access_token,
                function (resp) {
                    if (resp) {
                        row[outlookhead.indexOf("First Name")] = resp.firstname || ""
                        row[outlookhead.indexOf("Last Name")] = resp.lastname || "";
                        row[outlookhead.indexOf("Title")] = resp.title || ""
                        if (resp.company) row[outlookhead.indexOf("Company")] = resp.company || ""
                        if (resp.name) row[outlookhead.indexOf("Company")] = resp.name || ""

                        if (resp.accounts)
                            row[outlookhead.indexOf("Company")] = resp.accounts[0].name || "";

                        var phones = getInfonodes(resp.infonodes, 'phones');

                        if (phones.length) {
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
                        var emails = getInfonodes(resp.infonodes, 'emails');
                        if (emails.length) {
                            var index = outlookhead.indexOf("E-mail Address")
                            console.log(emails);
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
                        if(websites!=undefined) {
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
                        }
                        var addresses = getInfonodes(resp.infonodes, 'addresses');
                        if (addresses!=undefined) {


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
                        if (resp.topics!=undefined) {
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
                        if (resp.opportunities!=undefined) {
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
                        if (resp.cases!=undefined) {
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
                        if (resp.events!=undefined) {
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
            CallBack(baseUrl + params.fileName + "_" + params.tab + ".csv?authuser=1");
            if (err) error(err);

        }
    );


};
exports.exportOpportunity = function (params, CallBack, error) {
    var out = [oppohead];
    var p = {order: "-updated_at", limit: 100, tags: params.tags, stage: params.stage}
    var nextPageToken = "az";
    var file = bucket.file(params.fileName + "_" + params.tab + ".csv");
    console.log(params);

    file.acl.add(
        {
            "entity": params.email,
            "role": gcs.acl.OWNER_ROLE,
            "generation": "1"
        }
        , function (err, aclObject, apiResponse) {
            console.log(apiResponse);
        });
    var opts = {metadata: {cacheControl: "public, max-age=300"}}
    var remoteWriteStream = file.createWriteStream();
    async.whilst(
        function () {
            return nextPageToken != undefined;
        },
        function (next) {

            request.post({url: params.listUrl, json: p}, function (error, response, body) {
                nextPageToken = body.nextPageToken;
                console.log(body);
                var i = 0
                async.whilst(
                    function () {
                        return i < body.items.length;
                    },
                    function (callback) {
                        var item = body.items[i]
                        var row = [];
                        for (var j = 0; j < oppohead.length; j++) {
                            row.push("");
                        }
                        var p = {

                            documents: {limit: "7"},
                            events: {},
                            id: item.id,
                            opportunities: {limit: "7"},
                            tasks: {},
                            topics: {limit: "100"}
                        }
                        getItem(p, params.getUrl, params.access_token,
                            function (resp) {
                                row[oppohead.indexOf("Name")] = resp.name || ""
                                row[oppohead.indexOf("Amount Per Unit")] = resp.amount_per_unit || ""
                                row[oppohead.indexOf("Total Amount")] = resp.amount_total || ""
                                row[oppohead.indexOf("Closed At")] = resp.closed_date || ""
                                row[oppohead.indexOf("Currency")] = resp.currency || ""
                                row[oppohead.indexOf("Created At")] = resp.created_at || ""
                                row[oppohead.indexOf("Decission Process")] = resp.decission_process || ""
                                row[oppohead.indexOf("Duration")] = resp.duration_unit || ""
                                row[oppohead.indexOf("Need")] = resp.need || ""
                                row[oppohead.indexOf("Opportunity Type")] = resp.opportunity_type || ""
                                if (resp.current_stage)
                                    row[oppohead.indexOf("Current Stage")] = resp.current_stage.name || "";
                                if (resp.account)
                                    row[oppohead.indexOf("Company")] = resp.account.name || "";
                                if (resp.contacts) {
                                    var contacts = resp.contacts
                                    var index = oppohead.indexOf("Related Contact")
                                    row[index] = contacts[0].firstname + " " + contacts[0].lastname;
                                    if (contacts.length > 1) {
                                        for (var k = 1; k < contacts.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (oppohead.indexOf("Related Contact " + k) > 0) {
                                                row[oppohead.indexOf("Related Contact " + k)] = contacts[k].firstname + " " + contacts[k].lastname;
                                            } else {
                                                oppohead.splice(index + k, 0, "Related Contact " + k);
                                                row.splice(index + k, 0, contacts[k].firstname + " " + contacts[k].lastname);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }
                                if (resp.competitors) {
                                    var competitors = resp.competitors
                                    var index = oppohead.indexOf("Competitor")
                                    row[index] = competitors[0].name;
                                    if (competitors.length > 1) {
                                        for (var k = 1; k < competitors.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (oppohead.indexOf("Competitor " + k) > 0) {
                                                row[oppohead.indexOf("Competitor " + k)] = competitors[k].name;
                                            } else {
                                                oppohead.splice(index + k, 0, "Competitor " + k);
                                                row.splice(index + k, 0, competitors[k].name);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }

                                if (resp.tags) {
                                    var tags = resp.tags
                                    var index = oppohead.indexOf("Category")
                                    row[index] = tags[0].name;
                                    if (tags.length > 1) {
                                        for (var k = 1; k < tags.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (oppohead.indexOf("Category " + k) > 0) {
                                                row[oppohead.indexOf("Category " + k)] = tags[k].name;
                                            } else {
                                                oppohead.splice(index + k, 0, "Category " + k);
                                                row.splice(index + k, 0, tags[k].name);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }
                                if (resp.topics) {
                                    var notes = resp.topics.items
                                    var index = oppohead.indexOf("Note")
                                    row[index] = "Note Title : " + notes[0].title + ", Note Content : " + notes[0].excerpt;
                                    if (notes.length > 1) {
                                        for (var k = 1; k < notes.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (oppohead.indexOf("Note " + k) > 0) {
                                                row[oppohead.indexOf("Note " + k)] = "Note Title : " + notes[k].title + ", Note Content : " + notes[k].excerpt;
                                            } else {
                                                oppohead.splice(index + k, 0, "Note " + k);
                                                row.splice(index + k, 0, "Note Title : " + notes[k].title + ", Note Content : " + notes[k].excerpt);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }
                                var customfields = getInfonodes(resp.infonodes, 'customfields');
                                for (var k = 0; k < customfields.length; k++) {
                                    var o = customfields[k]
                                    //console.log(outlookhead.indexOf("E-mail " + k + " Address")) Custom Field 1 - Value
                                    if (oppohead.indexOf("Custom Field " + (k + 1) + " - Value") > 0) {
                                        row[oppohead.indexOf("Custom Field " + (k + 1) + " - Value")] = o[Object.keys(o)[0]];
                                        row[oppohead.indexOf("Custom Field " + (k + 1) + " - Type")] = Object.keys(o)[0];
                                    } else {
                                        var index = oppohead.push("Custom Field " + (k + 1) + " - Value");
                                        row.splice(index - 1, 0, o[Object.keys(o)[0]])
                                        //refrech_tab(out, index -1)
                                        index = oppohead.push("Custom Field " + (k + 1) + " - Type");
                                        row.splice(index - 1, 0, Object.keys(o)[0]);
                                        //refrech_tab(out, index -1)

                                    }
                                }
                                if (resp.timeline) {
                                    var timeline = resp.timeline.items
                                    var index = oppohead.indexOf("Time scale")
                                    row[index] = "Time scale Title: " + timeline[0].title
                                        + ", Time scale Status :" + timeline[0].priority
                                        + ", Start At :" + timeline[0].ends_at
                                        + ", Created At :" + timeline[0].created_at
                                        + ", End At :" + timeline[0].starts_at
                                        + ", Hosted In :" + timeline[0].where
                                    if (timeline.length > 1) {
                                        for (var k = 1; k < timeline.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (oppohead.indexOf("Time scale " + k) > 0) {
                                                row[oppohead.indexOf("Note " + k)] = "Time scale Title: " + events[k].title
                                                    + ", Time scale Status :" + timeline[k].priority
                                                    + ", Start At :" + timeline[k].ends_at
                                                    + ", Created At :" + timeline[k].created_at
                                                    + ", End At :" + timeline[k].starts_at
                                                    + ", Hosted In :" + timeline[k].where
                                            } else {
                                                oppohead.splice(index + k, 0, "Time scale " + k);
                                                row.splice(index + k, 0, "Time scale Title: " + timeline[k].title
                                                    + ", Time scale Status :" + timeline[k].priority
                                                    + ", Start At :" + timeline[k].ends_at
                                                    + ", Created At :" + timeline[k].created_at
                                                    + ", End At :" + timeline[k].starts_at
                                                    + ", Hosted In :" + timeline[k].where);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }
                                if (resp.events) {
                                    var events = resp.events.items
                                    var index = oppohead.indexOf("Event")
                                    row[index] = "Event Title: " + events[0].title
                                        + ", Event Status :" + events[0].priority
                                        + ", Start At :" + events[0].ends_at
                                        + ", Created At :" + events[0].created_at
                                        + ", End At :" + events[0].starts_at
                                        + ", Hosted In :" + events[0].where
                                    if (events.length > 1) {
                                        for (var k = 1; k < events.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (oppohead.indexOf("Event " + k) > 0) {
                                                row[oppohead.indexOf("Event " + k)] =
                                                    "Event Title: " + events[k].title
                                                    + ", Event Status :" + events[k].priority
                                                    + ", Start At :" + events[k].ends_at
                                                    + ", Created At :" + events[k].created_at
                                                    + ", End At :" + events[k].starts_at
                                                    + ", Hosted In :" + events[k].where
                                            } else {
                                                oppohead.splice(index + k, 0, "Event " + k);
                                                row.splice(index + k, 0, "Event Title: " + events[k].title
                                                    + ", Event Status :" + events[k].priority
                                                    + ", Start At :" + events[k].ends_at
                                                    + ", Created At :" + events[k].created_at
                                                    + ", End At :" + events[k].starts_at
                                                    + ", Hosted In :" + events[k].where);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }
                                if (resp.tasks) {
                                    var tasks = resp.tasks.items
                                    var index = oppohead.indexOf("Task")
                                    row[index] = +"Task Title: " + tasks[0].title
                                        + ", Task Status :" + tasks[0].priority
                                        + ", Created At :" + tasks[0].created_at
                                        + ", Created By :" + tasks[0].created_by.display_name
                                        + ", Due Date :" + tasks[0].due
                                    if (tasks.length > 1) {
                                        for (var k = 1; k < tasks.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (oppohead.indexOf("Task " + k) > 0) {
                                                row[oppohead.indexOf("Task " + k)] = +"Task Title: " + tasks[k].title
                                                    + ", Task Status :" + tasks[k].priority
                                                    + ", Created At :" + tasks[k].created_at
                                                    + ", Created By :" + tasks[k].created_by.display_name
                                                    + ", Due Date :" + tasks[k].due
                                            } else {
                                                oppohead.splice(index + k, 0, "Task " + k);
                                                row.splice(index + k, 0, +"Task Title: " + tasks[k].title
                                                    + ", Task Status :" + tasks[k].priority
                                                    + ", Created At :" + tasks[k].created_at
                                                    + ", Created By :" + tasks[k].created_by.display_name
                                                    + ", Due Date :" + tasks[k].due);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }


                                out.push(row);

                                callback()
                            }
                        );
                        i++;
                    },
                    function (err) {
                        next();
                    }
                );

                p = {
                    order: "-updated_at",
                    limit: 100,
                    pageToken: nextPageToken,
                    tags: params.tags,
                    stage: params.stage
                }


            }).auth(null, null, true, params.access_token);
            //console.log("------->", nextPageToken);
        },
        function (err) {
            csv()
                .from(out)
                .to(remoteWriteStream);
            CallBack(baseUrl + params.fileName + "_" + params.tab + ".csv?authuser=1");
            if (err) error(err);

        }
    )
    ;

};
exports.exportOpportunityByKeys = function (params, CallBack, error) {
    var out = [oppohead];
    var file = bucket.file(params.fileName + "_" + params.tab + ".csv");
    file.acl.add(
        {
            "entity": params.email,
            "role": gcs.acl.OWNER_ROLE,
            "generation": "1"
        }
        , function (err, aclObject, apiResponse) {
            console.log(apiResponse);
            console.log(err);
        });
    console.log(params);

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
            for (var j = 0; j < oppohead.length; j++) {
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


            getItem(p, params.getUrl, params.access_token,
                function (resp) {
                    row[oppohead.indexOf("Name")] = resp.name || ""
                    row[oppohead.indexOf("Amount Per Unit")] = resp.amount_per_unit || ""
                    row[oppohead.indexOf("Total Amount")] = resp.amount_total || ""
                    row[oppohead.indexOf("Closed At")] = resp.closed_date || ""
                    row[oppohead.indexOf("Currency")] = resp.currency || ""
                    row[oppohead.indexOf("Created At")] = resp.created_at || ""
                    row[oppohead.indexOf("Decission Process")] = resp.decission_process || ""
                    row[oppohead.indexOf("Duration")] = resp.duration_unit || ""
                    row[oppohead.indexOf("Need")] = resp.need || ""
                    row[oppohead.indexOf("Opportunity Type")] = resp.opportunity_type || ""
                    if (resp.current_stage)
                        row[oppohead.indexOf("Current Stage")] = resp.current_stage.name || "";
                    if (resp.account)
                        row[oppohead.indexOf("Company")] = resp.account.name || "";
                    if (resp.contacts) {
                        var contacts = resp.contacts
                        var index = oppohead.indexOf("Related Contact")
                        row[index] = contacts[0].firstname + " " + contacts[0].lastname;
                        if (contacts.length > 1) {
                            for (var k = 1; k < contacts.length; k++) {
                                //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                if (oppohead.indexOf("Related Contact " + k) > 0) {
                                    row[oppohead.indexOf("Related Contact " + k)] = contacts[k].firstname + " " + contacts[k].lastname;
                                } else {
                                    oppohead.splice(index + k, 0, "Related Contact " + k);
                                    row.splice(index + k, 0, contacts[k].firstname + " " + contacts[k].lastname);
                                    refrech_tab(out, index + k)
                                }
                            }
                        }
                    }
                    if (resp.competitors) {
                        var competitors = resp.competitors
                        var index = oppohead.indexOf("Competitor")
                        row[index] = competitors[0].name;
                        if (competitors.length > 1) {
                            for (var k = 1; k < competitors.length; k++) {
                                //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                if (oppohead.indexOf("Competitor " + k) > 0) {
                                    row[oppohead.indexOf("Competitor " + k)] = competitors[k].name;
                                } else {
                                    oppohead.splice(index + k, 0, "Competitor " + k);
                                    row.splice(index + k, 0, competitors[k].name);
                                    refrech_tab(out, index + k)
                                }
                            }
                        }
                    }
                    if (resp.tags) {
                        var tags = resp.tags
                        var index = oppohead.indexOf("Category")
                        row[index] = tags[0].name;
                        if (tags.length > 1) {
                            for (var k = 1; k < tags.length; k++) {
                                //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                if (oppohead.indexOf("Category " + k) > 0) {
                                    row[oppohead.indexOf("Category " + k)] = tags[k].name;
                                } else {
                                    oppohead.splice(index + k, 0, "Category " + k);
                                    row.splice(index + k, 0, tags[k].name);
                                    refrech_tab(out, index + k)
                                }
                            }
                        }
                    }
                    if (resp.topics) {
                        var notes = resp.topics.items
                        var index = oppohead.indexOf("Note")
                        row[index] = "Note Title : " + notes[0].title + ", Note Content : " + notes[0].excerpt;
                        if (notes.length > 1) {
                            for (var k = 1; k < notes.length; k++) {
                                //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                if (oppohead.indexOf("Note " + k) > 0) {
                                    row[oppohead.indexOf("Note " + k)] = "Note Title : " + notes[k].title + ", Note Content : " + notes[k].excerpt;
                                } else {
                                    oppohead.splice(index + k, 0, "Note " + k);
                                    row.splice(index + k, 0, "Note Title : " + notes[k].title + ", Note Content : " + notes[k].excerpt);
                                    refrech_tab(out, index + k)
                                }
                            }
                        }
                    }
                    var customfields = getInfonodes(resp.infonodes, 'customfields');
                    for (var k = 0; k < customfields.length; k++) {
                        var o = customfields[k]
                        //console.log(outlookhead.indexOf("E-mail " + k + " Address")) Custom Field 1 - Value
                        if (oppohead.indexOf("Custom Field " + (k + 1) + " - Value") > 0) {
                            row[oppohead.indexOf("Custom Field " + (k + 1) + " - Value")] = o[Object.keys(o)[0]];
                            row[oppohead.indexOf("Custom Field " + (k + 1) + " - Type")] = Object.keys(o)[0];
                        } else {
                            var index = oppohead.push("Custom Field " + (k + 1) + " - Value");
                            row.splice(index - 1, 0, o[Object.keys(o)[0]])
                            //refrech_tab(out, index -1)
                            index = oppohead.push("Custom Field " + (k + 1) + " - Type");
                            row.splice(index - 1, 0, Object.keys(o)[0]);
                            //refrech_tab(out, index -1)

                        }
                    }
                    if (resp.timeline) {
                        var timeline = resp.timeline.items
                        var index = oppohead.indexOf("Time scale")
                        row[index] = "Time scale Title: " + timeline[0].title
                            + ", Time scale Status :" + timeline[0].priority
                            + ", Start At :" + timeline[0].ends_at
                            + ", Created At :" + timeline[0].created_at
                            + ", End At :" + timeline[0].starts_at
                            + ", Hosted In :" + timeline[0].where
                        if (timeline.length > 1) {
                            for (var k = 1; k < timeline.length; k++) {
                                //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                if (oppohead.indexOf("Time scale " + k) > 0) {
                                    row[oppohead.indexOf("Note " + k)] = "Time scale Title: " + events[k].title
                                        + ", Time scale Status :" + timeline[k].priority
                                        + ", Start At :" + timeline[k].ends_at
                                        + ", Created At :" + timeline[k].created_at
                                        + ", End At :" + timeline[k].starts_at
                                        + ", Hosted In :" + timeline[k].where
                                } else {
                                    oppohead.splice(index + k, 0, "Time scale " + k);
                                    row.splice(index + k, 0, "Time scale Title: " + timeline[k].title
                                        + ", Time scale Status :" + timeline[k].priority
                                        + ", Start At :" + timeline[k].ends_at
                                        + ", Created At :" + timeline[k].created_at
                                        + ", End At :" + timeline[k].starts_at
                                        + ", Hosted In :" + timeline[k].where);
                                    refrech_tab(out, index + k)
                                }
                            }
                        }
                    }
                    if (resp.events) {
                        var events = resp.events.items
                        var index = oppohead.indexOf("Event")
                        row[index] = "Event Title: " + events[0].title
                            + ", Event Status :" + events[0].priority
                            + ", Start At :" + events[0].ends_at
                            + ", Created At :" + events[0].created_at
                            + ", End At :" + events[0].starts_at
                            + ", Hosted In :" + events[0].where
                        if (events.length > 1) {
                            for (var k = 1; k < events.length; k++) {
                                //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                if (oppohead.indexOf("Event " + k) > 0) {
                                    row[oppohead.indexOf("Event " + k)] =
                                        "Event Title: " + events[k].title
                                        + ", Event Status :" + events[k].priority
                                        + ", Start At :" + events[k].ends_at
                                        + ", Created At :" + events[k].created_at
                                        + ", End At :" + events[k].starts_at
                                        + ", Hosted In :" + events[k].where
                                } else {
                                    oppohead.splice(index + k, 0, "Event " + k);
                                    row.splice(index + k, 0, "Event Title: " + events[k].title
                                        + ", Event Status :" + events[k].priority
                                        + ", Start At :" + events[k].ends_at
                                        + ", Created At :" + events[k].created_at
                                        + ", End At :" + events[k].starts_at
                                        + ", Hosted In :" + events[k].where);
                                    refrech_tab(out, index + k)
                                }
                            }
                        }
                    }
                    if (resp.tasks) {
                        var tasks = resp.tasks.items
                        var index = oppohead.indexOf("Task")
                        row[index] = +"Task Title: " + tasks[0].title
                            + ", Task Status :" + tasks[0].priority
                            + ", Created At :" + tasks[0].created_at
                            + ", Created By :" + tasks[0].created_by.display_name
                            + ", Due Date :" + tasks[0].due
                        if (tasks.length > 1) {
                            for (var k = 1; k < tasks.length; k++) {
                                //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                if (oppohead.indexOf("Task " + k) > 0) {
                                    row[oppohead.indexOf("Task " + k)] = +"Task Title: " + tasks[k].title
                                        + ", Task Status :" + tasks[k].priority
                                        + ", Created At :" + tasks[k].created_at
                                        + ", Created By :" + tasks[k].created_by.display_name
                                        + ", Due Date :" + tasks[k].due
                                } else {
                                    oppohead.splice(index + k, 0, "Task " + k);
                                    row.splice(index + k, 0, +"Task Title: " + tasks[k].title
                                        + ", Task Status :" + tasks[k].priority
                                        + ", Created At :" + tasks[k].created_at
                                        + ", Created By :" + tasks[k].created_by.display_name
                                        + ", Due Date :" + tasks[k].due);
                                    refrech_tab(out, index + k)
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
            CallBack(baseUrl + params.fileName + "_" + params.tab + ".csv?authuser=1");
            if (err) error(err);

        }
    );


};
exports.exportCase = function (params, CallBack, error) {
    var out = [casehead];
    var p = {tags: params.tags, order: "-updated_at", limit: 20}
    var nextPageToken = "az";
    var file = bucket.file(params.fileName + "_" + params.tab + ".csv");
    console.log(params);

    file.acl.add(
        {
            "entity": params.email,
            "role": gcs.acl.OWNER_ROLE,
            "generation": "1"
        }
        , function (err, aclObject, apiResponse) {
            console.log(apiResponse);
        });
    var opts = {metadata: {cacheControl: "public, max-age=300"}}
    var remoteWriteStream = file.createWriteStream();
    async.whilst(
        function () {
            return nextPageToken != undefined;
        },
        function (next) {

            request.post({url: params.listUrl, json: p}, function (error, response, body) {
                nextPageToken = body.nextPageToken;
                console.log(body);
                var i = 0
                async.whilst(
                    function () {
                        return i < body.items.length;
                    },
                    function (callback) {
                        var item = body.items[i]
                        var row = [];
                        for (var j = 0; j < oppohead.length; j++) {
                            row.push("");
                        }
                        var p = {id: item.id, topics: {limit: "7"}, documents: {limit: "15"}, tasks: {}, events: {}}
                        //var p = {
                        //
                        //    documents: {limit: "7"},
                        //    events: {},
                        //    id: item.id,
                        //    opportunities: {limit: "7"},
                        //    tasks: {},
                        //    topics: {limit: "100"}
                        //}
                        getItem(p, params.getUrl, params.access_token,
                            function (resp) {
                                row[casehead.indexOf("Case Title")] = resp.name || ""
                                row[casehead.indexOf("Case Priority")] = resp.priority || ""
                                row[casehead.indexOf("Description")] = resp.description || ""
                                if (resp.account)
                                    row[casehead.indexOf("Related Account")] = resp.account.name || "";
                                if (resp.current_status)
                                    row[casehead.indexOf("Case Status")] = resp.current_status.name || "";
                                if (resp.contact)
                                    row[casehead.indexOf("Related Contact")] = resp.contact.firstname + " " + resp.contact.lastname || "";

                                if (resp.tags) {
                                    var tags = resp.tags
                                    var index = casehead.indexOf("Category")
                                    row[index] = tags[0].name;
                                    if (tags.length > 1) {
                                        for (var k = 1; k < tags.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (casehead.indexOf("Category " + k) > 0) {
                                                row[casehead.indexOf("Category " + k)] = tags[k].name;
                                            } else {
                                                casehead.splice(index + k, 0, "Category " + k);
                                                row.splice(index + k, 0, tags[k].name);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }
                                if (resp.topics) {
                                    var notes = resp.topics.items
                                    var index = casehead.indexOf("Note")
                                    row[index] = "Note Title : " + notes[0].title + ", Note Content : " + notes[0].excerpt;
                                    if (notes.length > 1) {
                                        for (var k = 1; k < notes.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (casehead.indexOf("Note " + k) > 0) {
                                                row[casehead.indexOf("Note " + k)] = "Note Title : " + notes[k].title + ", Note Content : " + notes[k].excerpt;
                                            } else {
                                                casehead.splice(index + k, 0, "Note " + k);
                                                row.splice(index + k, 0, "Note Title : " + notes[k].title + ", Note Content : " + notes[k].excerpt);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }
                                var customfields = getInfonodes(resp.infonodes, 'customfields');
                                for (var k = 0; k < customfields.length; k++) {
                                    var o = customfields[k]
                                    //console.log(outlookhead.indexOf("E-mail " + k + " Address")) Custom Field 1 - Value
                                    if (casehead.indexOf("Custom Field " + (k + 1) + " - Value") > 0) {
                                        row[casehead.indexOf("Custom Field " + (k + 1) + " - Value")] = o[Object.keys(o)[0]];
                                        row[casehead.indexOf("Custom Field " + (k + 1) + " - Type")] = Object.keys(o)[0];
                                    } else {
                                        var index = casehead.push("Custom Field " + (k + 1) + " - Value");
                                        row.splice(index - 1, 0, o[Object.keys(o)[0]])
                                        //refrech_tab(out, index -1)
                                        index = casehead.push("Custom Field " + (k + 1) + " - Type");
                                        row.splice(index - 1, 0, Object.keys(o)[0]);
                                        //refrech_tab(out, index -1)

                                    }
                                }
                                if (resp.events) {
                                    var events = resp.events.items
                                    var index = casehead.indexOf("Event")
                                    row[index] = "Event Title: " + events[0].title
                                        + ", Event Status :" + events[0].priority
                                        + ", Start At :" + events[0].ends_at
                                        + ", Created At :" + events[0].created_at
                                        + ", End At :" + events[0].starts_at
                                        + ", Hosted In :" + events[0].where
                                    if (events.length > 1) {
                                        for (var k = 1; k < events.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (casehead.indexOf("Event " + k) > 0) {
                                                row[casehead.indexOf("Event " + k)] =
                                                    "Event Title: " + events[k].title
                                                    + ", Event Status :" + events[k].priority
                                                    + ", Start At :" + events[k].ends_at
                                                    + ", Created At :" + events[k].created_at
                                                    + ", End At :" + events[k].starts_at
                                                    + ", Hosted In :" + events[k].where
                                            } else {
                                                casehead.splice(index + k, 0, "Event " + k);
                                                row.splice(index + k, 0, "Event Title: " + events[k].title
                                                    + ", Event Status :" + events[k].priority
                                                    + ", Start At :" + events[k].ends_at
                                                    + ", Created At :" + events[k].created_at
                                                    + ", End At :" + events[k].starts_at
                                                    + ", Hosted In :" + events[k].where);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }
                                if (resp.tasks) {
                                    var tasks = resp.tasks.items
                                    var index = casehead.indexOf("Task")
                                    row[index] = +"Task Title: " + tasks[0].title
                                        + ", Task Status :" + tasks[0].priority
                                        + ", Created At :" + tasks[0].created_at
                                        + ", Created By :" + tasks[0].created_by.display_name
                                        + ", Due Date :" + tasks[0].due
                                    if (tasks.length > 1) {
                                        for (var k = 1; k < tasks.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (casehead.indexOf("Task " + k) > 0) {
                                                row[casehead.indexOf("Task " + k)] = +"Task Title: " + tasks[k].title
                                                    + ", Task Status :" + tasks[k].priority
                                                    + ", Created At :" + tasks[k].created_at
                                                    + ", Created By :" + tasks[k].created_by.display_name
                                                    + ", Due Date :" + tasks[k].due
                                            } else {
                                                casehead.splice(index + k, 0, "Task " + k);
                                                row.splice(index + k, 0, +"Task Title: " + tasks[k].title
                                                    + ", Task Status :" + tasks[k].priority
                                                    + ", Created At :" + tasks[k].created_at
                                                    + ", Created By :" + tasks[k].created_by.display_name
                                                    + ", Due Date :" + tasks[k].due);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }


                                out.push(row);

                                callback()
                            }
                        );
                        i++;
                    },
                    function (err) {
                        next();
                    }
                );

                p = {tags: params.tag, order: "-updated_at", limit: 20}


            }).auth(null, null, true, params.access_token);
            //console.log("------->", nextPageToken);
        },
        function (err) {
            csv()
                .from(out)
                .to(remoteWriteStream);
            CallBack(baseUrl + params.fileName + "_" + params.tab + ".csv?authuser=1");
            if (err) error(err);

        }
    )
    ;

};
exports.exportCaseByKeys = function (params, CallBack, error) {
    var out = [casehead];
    var file = bucket.file(params.fileName + "_" + params.tab + ".csv");
    file.acl.add(
        {
            "entity": params.email,
            "role": gcs.acl.OWNER_ROLE,
            "generation": "1"
        }
        , function (err, aclObject, apiResponse) {
            console.log(apiResponse);
            console.log(err);
        });
    console.log(params);

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
            for (var j = 0; j < casehead.length; j++) {
                row.push("");
            }


            var p = {id: id, topics: {limit: "7"}, documents: {limit: "15"}, tasks: {}, events: {}}

            getItem(p, params.getUrl, params.access_token,
                function (resp) {
                    row[casehead.indexOf("Case Title")] = resp.name || ""
                    row[casehead.indexOf("Case Status")] = resp.status || ""
                    row[casehead.indexOf("Case Periority")] = resp.priority || ""
                    row[casehead.indexOf("Description")] = resp.description || ""
                    if (resp.account)
                        row[casehead.indexOf("Related Account")] = resp.account.name || "";
                    if (resp.contact)
                        row[casehead.indexOf("Related Account")] = resp.contact.firstname + " " + resp.contact.$lastname || "";

                    if (resp.tags) {
                        var tags = resp.tags
                        var index = casehead.indexOf("Category")
                        row[index] = tags[0].name;
                        if (tags.length > 1) {
                            for (var k = 1; k < tags.length; k++) {
                                //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                if (casehead.indexOf("Category " + k) > 0) {
                                    row[casehead.indexOf("Category " + k)] = tags[k].name;
                                } else {
                                    casehead.splice(index + k, 0, "Category " + k);
                                    row.splice(index + k, 0, tags[k].name);
                                    refrech_tab(out, index + k)
                                }
                            }
                        }
                    }
                    if (resp.topics) {
                        var notes = resp.topics.items
                        var index = casehead.indexOf("Note")
                        row[index] = "Note Title : " + notes[0].title + ", Note Content : " + notes[0].excerpt;
                        if (notes.length > 1) {
                            for (var k = 1; k < notes.length; k++) {
                                //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                if (casehead.indexOf("Note " + k) > 0) {
                                    row[casehead.indexOf("Note " + k)] = "Note Title : " + notes[k].title + ", Note Content : " + notes[k].excerpt;
                                } else {
                                    casehead.splice(index + k, 0, "Note " + k);
                                    row.splice(index + k, 0, "Note Title : " + notes[k].title + ", Note Content : " + notes[k].excerpt);
                                    refrech_tab(out, index + k)
                                }
                            }
                        }
                    }
                    var customfields = getInfonodes(resp.infonodes, 'customfields');
                    for (var k = 0; k < customfields.length; k++) {
                        var o = customfields[k]
                        //console.log(outlookhead.indexOf("E-mail " + k + " Address")) Custom Field 1 - Value
                        if (casehead.indexOf("Custom Field " + (k + 1) + " - Value") > 0) {
                            row[casehead.indexOf("Custom Field " + (k + 1) + " - Value")] = o[Object.keys(o)[0]];
                            row[casehead.indexOf("Custom Field " + (k + 1) + " - Type")] = Object.keys(o)[0];
                        } else {
                            var index = casehead.push("Custom Field " + (k + 1) + " - Value");
                            row.splice(index - 1, 0, o[Object.keys(o)[0]])
                            //refrech_tab(out, index -1)
                            index = casehead.push("Custom Field " + (k + 1) + " - Type");
                            row.splice(index - 1, 0, Object.keys(o)[0]);
                            //refrech_tab(out, index -1)

                        }
                    }
                    if (resp.events) {
                        var events = resp.events.items
                        var index = casehead.indexOf("Event")
                        row[index] = "Event Title: " + events[0].title
                            + ", Event Status :" + events[0].priority
                            + ", Start At :" + events[0].ends_at
                            + ", Created At :" + events[0].created_at
                            + ", End At :" + events[0].starts_at
                            + ", Hosted In :" + events[0].where
                        if (events.length > 1) {
                            for (var k = 1; k < events.length; k++) {
                                //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                if (casehead.indexOf("Event " + k) > 0) {
                                    row[casehead.indexOf("Event " + k)] =
                                        "Event Title: " + events[k].title
                                        + ", Event Status :" + events[k].priority
                                        + ", Start At :" + events[k].ends_at
                                        + ", Created At :" + events[k].created_at
                                        + ", End At :" + events[k].starts_at
                                        + ", Hosted In :" + events[k].where
                                } else {
                                    casehead.splice(index + k, 0, "Event " + k);
                                    row.splice(index + k, 0, "Event Title: " + events[k].title
                                        + ", Event Status :" + events[k].priority
                                        + ", Start At :" + events[k].ends_at
                                        + ", Created At :" + events[k].created_at
                                        + ", End At :" + events[k].starts_at
                                        + ", Hosted In :" + events[k].where);
                                    refrech_tab(out, index + k)
                                }
                            }
                        }
                    }
                    if (resp.tasks) {
                        var tasks = resp.tasks.items
                        var index = casehead.indexOf("Task")
                        row[index] = +"Task Title: " + tasks[0].title
                            + ", Task Status :" + tasks[0].priority
                            + ", Created At :" + tasks[0].created_at
                            + ", Created By :" + tasks[0].created_by.display_name
                            + ", Due Date :" + tasks[0].due
                        if (tasks.length > 1) {
                            for (var k = 1; k < tasks.length; k++) {
                                //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                if (casehead.indexOf("Task " + k) > 0) {
                                    row[casehead.indexOf("Task " + k)] = +"Task Title: " + tasks[k].title
                                        + ", Task Status :" + tasks[k].priority
                                        + ", Created At :" + tasks[k].created_at
                                        + ", Created By :" + tasks[k].created_by.display_name
                                        + ", Due Date :" + tasks[k].due
                                } else {
                                    casehead.splice(index + k, 0, "Task " + k);
                                    row.splice(index + k, 0, +"Task Title: " + tasks[k].title
                                        + ", Task Status :" + tasks[k].priority
                                        + ", Created At :" + tasks[k].created_at
                                        + ", Created By :" + tasks[k].created_by.display_name
                                        + ", Due Date :" + tasks[k].due);
                                    refrech_tab(out, index + k)
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
            CallBack(baseUrl + params.fileName + "_" + params.tab + ".csv?authuser=1");
            if (err) error(err);

        }
    );

};
exports.exportTask = function (params, CallBack, error) {
    var out = [taskhead];
    var p = {tags: params.tags, order: "-updated_at", limit: 100}
    var nextPageToken = "az";
    var file = bucket.file(params.fileName + "_" + params.tab + ".csv");
    console.log(params);

    file.acl.add(
        {
            "entity": params.email,
            "role": gcs.acl.OWNER_ROLE,
            "generation": "1"
        }
        , function (err, aclObject, apiResponse) {
            console.log(apiResponse);
        });
    var opts = {metadata: {cacheControl: "public, max-age=300"}}
    var remoteWriteStream = file.createWriteStream();
    async.whilst(
        function () {
            return nextPageToken != undefined;
        },
        function (next) {
            request.post({url: params.listUrl, json: p},
                function (error, response, body) {
                    nextPageToken = body.nextPageToken;
                    var i = 0
                    async.whilst(
                        function () {
                            return i < body.items.length;
                        },
                        function (callback) {
                            var item = body.items[i]
                            var row = [];
                            for (var j = 0; j < taskhead.length; j++) {
                                row.push("");
                            }
                            request.get({url: params.getUrl + item.id, json: true}, function (a, b, resp) {
                                row[taskhead.indexOf("Task Title")] = resp.title || "";
                                row[taskhead.indexOf("Created At")] = resp.created_at || "";
                                row[taskhead.indexOf("Due Date")] = resp.due || "";
                                row[taskhead.indexOf("Task Status")] = resp.status || ""
                                row[taskhead.indexOf("Task Status Label")] = resp.status_label || ""
                                if (resp.about)
                                    row[taskhead.indexOf("Related To")] = resp.about.name + " (" + resp.about.kind + ")" || "";
                                if (resp.created_by)
                                    row[taskhead.indexOf("Opened By")] = resp.created_by.display_name || "";

                                if (resp.tags) {
                                    var tags = resp.tags
                                    var index = taskhead.indexOf("Category")
                                    row[index] = tags[0].name;
                                    if (tags.length > 1) {
                                        for (var k = 1; k < tags.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (taskhead.indexOf("Category " + k) > 0) {
                                                row[taskhead.indexOf("Category " + k)] = tags[k].name;
                                            } else {
                                                taskhead.splice(index + k, 0, "Category " + k);
                                                row.splice(index + k, 0, tags[k].name);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }
                                if (resp.assignees) {
                                    var assignees = resp.assignees
                                    var index = taskhead.indexOf("Assignees To")
                                    row[index] = assignees[0].display_name;
                                    if (assignees.length > 1) {
                                        for (var k = 1; k < assignees.length; k++) {
                                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                                            if (taskhead.indexOf("Assignees To " + k) > 0) {
                                                row[taskhead.indexOf("Category " + k)] = assignees[k].namdisplay_name;
                                            } else {
                                                taskhead.splice(index + k, 0, "Assignees To " + k);
                                                row.splice(index + k, 0, assignees[k].display_name);
                                                refrech_tab(out, index + k)
                                            }
                                        }
                                    }
                                }
                                out.push(row);
                                console.log(out);
                                callback()
                            }).auth(null, null, true, params.access_token);

                            i++;
                        },
                        function (err) {
                            next();
                        }
                    );

                    p = {tags: params.tag, order: "-updated_at", limit: 20}


                }).auth(null, null, true, params.access_token);
            //console.log("------->", nextPageToken);
        },
        function (err) {
            csv()
                .from(out)
                .to(remoteWriteStream);
            CallBack(baseUrl + params.fileName + "_" + params.tab + ".csv?authuser=1");
            if (err) error(err);

        }
    )
    ;

};
exports.exportTaskByKeys = function (params, CallBack, error) {
    var out = [taskhead];
    var file = bucket.file(params.fileName + "_" + params.tab + ".csv");
    file.acl.add(
        {
            "entity": params.email,
            "role": gcs.acl.OWNER_ROLE,
            "generation": "1"
        }
        , function (err, aclObject, apiResponse) {
            console.log(apiResponse);
            console.log(err);
        });
    console.log(params);

    var opts = {metadata: {cacheControl: "public, max-age=300"}}
    var remoteWriteStream = file.createWriteStream(opts);
    var i = 0
    var ids = eval(params.IDs)
    async.whilst(
        function () {
            return i < ids.length;
        },
        function (callback) {
            var id = ids[i];
            var row = [];
            for (var j = 0; j < taskhead.length; j++) {
                row.push("");
            }
            request.get({url: params.getUrl + id, json: true}, function (a, b, resp) {
                row[taskhead.indexOf("Task Title")] = resp.title || "";
                row[taskhead.indexOf("Created At")] = resp.created_at || "";
                row[taskhead.indexOf("Due Date")] = resp.due || "";
                row[taskhead.indexOf("Task Status")] = resp.status || ""
                row[taskhead.indexOf("Task Status Label")] = resp.status_label || ""
                if (resp.about)
                    row[taskhead.indexOf("Related To")] = resp.about.name + " (" + resp.about.kind + ")" || "";
                if (resp.created_by)
                    row[taskhead.indexOf("Opened By")] = resp.created_by.display_name || "";

                if (resp.tags) {
                    var tags = resp.tags
                    var index = taskhead.indexOf("Category")
                    row[index] = tags[0].name;
                    if (tags.length > 1) {
                        for (var k = 1; k < tags.length; k++) {
                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                            if (taskhead.indexOf("Category " + k) > 0) {
                                row[taskhead.indexOf("Category " + k)] = tags[k].name;
                            } else {
                                taskhead.splice(index + k, 0, "Category " + k);
                                row.splice(index + k, 0, tags[k].name);
                                refrech_tab(out, index + k)
                            }
                        }
                    }
                }
                if (resp.assignees) {
                    var assignees = resp.assignees
                    var index = taskhead.indexOf("Assignees To")
                    row[index] = assignees[0].display_name;
                    if (assignees.length > 1) {
                        for (var k = 1; k < assignees.length; k++) {
                            //console.log(outlookhead.indexOf("Mobile Phone " + k))
                            if (taskhead.indexOf("Assignees To " + k) > 0) {
                                row[taskhead.indexOf("Category " + k)] = assignees[k].namdisplay_name;
                            } else {
                                taskhead.splice(index + k, 0, "Assignees To " + k);
                                row.splice(index + k, 0, assignees[k].display_name);
                                refrech_tab(out, index + k)
                            }
                        }
                    }
                }
                out.push(row);
                callback()
            }).auth(null, null, true, params.access_token);


            i++;
        },
        function (err) {
            csv()
                .from(out)
                .to(remoteWriteStream);
            CallBack(baseUrl + params.fileName + "_" + params.tab + ".csv?authuser=1");
            if (err) error(err);

        }
    );

};






