/**
 * Created by Alejandro on 18/03/2016.
 */
var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    var Airtable = require('airtable');
    var base = new Airtable({ apiKey: 'keyyajjDuRNNFep2H' }).base('apppOR52k8mg9Zba0');

    base('PlainText').select({}).eachPage(function page(records, fetchNextPage) {
        var response = [];
        records.forEach(function(record) {
            response.push(record["_rawJson"]);
        });

      res.send(response);

    }, function done(error) {
        if (error) {
            console.log(error);
        }
    });
});

module.exports = router;