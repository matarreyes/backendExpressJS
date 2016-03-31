var express = require('express');
var fs = require('fs');
var request = require('request');
var router = express.Router();
var base64 = require('node-base64-image');
var Q = require('q');
var async = require("async");
var finish = require("finish");
var moment = require("moment");

/* GET home page. */
router.get('/', function (req, res, next) {
    //This checks if the db exists exists
    var nano = require('nano')('http://localhost:5984');
    var dbName = 'testdb';
    var testDb = nano.use(dbName);

    nano.db.list(function (error, databases) {
        if (error)
            console.log('Error 1');

        if (databases.indexOf(dbName) < 0) {
            nano.db.create(dbName, function (error, body, headers) {
                if (error)
                    console.log('Error 2');
            })
        }
    });

    //Update custom function, if not exists it creates the new one
    testDb.update = function (obj, key, callback) {
        var db = this;
        db.get(key, function (error, existing) {
            if (!error) obj._rev = existing._rev;
            db.insert(obj, key, callback);
        });
    };

    //Image update based on previous
    testDb.updateAttachments = function (img, doc, callback) {
        var db = this;
        var revision = {};
        db.get(doc, function (error, existing) {
            if (!error) revision.rev = existing._rev;
            db.attachment.insert(doc, doc + '.png', img, 'image/png', revision, callback);
        });
    };

    var sortByDate = function (a,b) {
        if (moment(a.fields.Date).isBefore(b.fields.Date))
            return -1;
        else if (moment(a.fields.Date).isAfter(b.fields.Date))
            return 1;
        else
            return 0;
    };


    //TODO Check if exists a table or document
    var Airtable = require('airtable');
    var base = new Airtable({apiKey: 'keyyajjDuRNNFep2H'}).base('apppOR52k8mg9Zba0');

    base('PlainText').select({}).eachPage(function page(records, fetchNextPage) {
        var response = [];
        async.forEach(records, processEachTask, afterAllTasks);

        function processEachTask(record, callback) {
            base64.base64encoder(record["_rawJson"].fields.uri, {string: true}, function (err, image) {
                if (err) {
                    console.log(err);
                }
                record['_rawJson'].fields.encodedImage = image;
                response.push(record["_rawJson"]);
                callback(err);
            });
        }

        function afterAllTasks(err) {
            //console.log(response.length);
            testDb.update({rows: response.sort(sortByDate)}, 'plain_text2', function (err, res) {
                if (err) return console.log('No update!');
                console.log('Updated!');
            });
        }

        /*records.forEach(function (record) {
            base64.base64encoder(record["_rawJson"].fields.uri, {string: true}, function (err, image) {
                if (err) {
                    console.log(err);
                }
                record['_rawJson'].fields.encodedImage = image;
                response.push(record["_rawJson"]);
            });
            console.log(response.length);
        });*/
        //}).then(function(){
        //    console.log("i sould be the last");
        //    console.log(response);
        //});

        /**
         * Test with images. Probably i would need to redo the tree of couchdb to store a line in each document.
         */
        /*response.forEach(function(val){
         try {
         request.get(val.fields.Image[0].url)
         .on('response', function (response) {
         }).pipe(fs.createWriteStream('./res/' + val.id + '.png').on('close', function () {
         fs.readFile('./res/' + val.id + '.png', function (err, data) {
         if (!err) {
         testDb.updateAttachments(data, 'plainTextImages_' + val.id, function (err, body) {
         if (!err)
         console.log("fine!");
         });
         }
         });
         }));
         }
         catch(e){
         console.log(e);
         }
         });*/

        /*testDb.update({rows: response}, 'plain_text2', function (err, res) {
         if (err) return console.log('No update!');
         console.log('Updated!');
         });*/
    }, function done(error) {
        if (error) {
            console.log(error);
        }
    });

    //to del
    /*var base = new Airtable({apiKey: 'keyyajjDuRNNFep2H'}).base('apppOR52k8mg9Zba0');
     base('Schedule').select({}).eachPage(function page(records, fetchNextPage) {
     var response = [];
     records.forEach(function (record) {
     response.push(record["_rawJson"]);
     });

     testDb.update({rows: response}, 'schedule', function (err, res) {
     if (err) return console.log('No update!');
     console.log('Updateds!');
     });
     }, function done(error) {
     if (error) {
     console.log(error);
     }
     });*/

    res.send("Ok!");
});

module.exports = router;
