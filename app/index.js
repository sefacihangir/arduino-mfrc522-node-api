var express = require('express');
var bodyParser = require('body-parser');
var MFRC522 = require('../node-server/MFRC522.js').MFRC522;
var keyA = 'ffffffffffff';

exports.startServer = function (port, path, callback) {
    console.log(port, path, callback);
    var app = express();

    app.use(express.static('public'));
    app.use(bodyParser.json());

    function handleError(err) {
        console.error("greska", err);
        throw err;
    }

    var mfrc522 = new MFRC522('COM9');

    app.post('/openCard', function (req, res) {
        mfrc522.open().then(function (r) {
            console.log('openCard', r);
            res.send(r);
        }, function (err) {
            res.status(500);
            console.log('err', err);
            res.send(err);
        });
    });

    app.post('/getUid', function (req, res) {
        mfrc522.getUID().then(function (r) {
            console.log('getUid', r);
            res.send(r.data);
        }, function (err) {
            res.status(500);
            res.send(err);
        });
    });

    app.post('/getType', function (req, res) {
        mfrc522.getType().then(function (r) {
            console.log('getType', r);
            res.send(r.data);
        }, function (err) {
            res.status(500);
            res.send(err);
        });
    });

    app.post('/read', function (req, res) {
        var n = req.body.blockNumber;
        var authenticate = (req.body.iskeyA != false) ? mfrc522.authenticateKeyA : mfrc522.authenticateKeyB;
        //console.log('read block', n, req.body.key);
        authenticate(n, req.body.key).then(function (r) {
            //console.log('authenticateKey read', r);
            mfrc522.read(n).then(function (r1) {
                //console.log('ReadBlock ', r1);
                res.send(r1);
            }, function (err) {
                res.status(500);
                err.method = 'read';
                res.send(err);
            });
        }, function (err) {
            res.status(500);
            err.method = 'authenticate';
            res.send(err);
        });
    });

    app.post('/write', function (req, res) {
        var n = req.body;
        var authenticate = (req.body.iskeyA != false) ? mfrc522.authenticateKeyA : mfrc522.authenticateKeyB;
        console.log('write block', n);
        authenticate(n.blockNumber, req.body.key).then(function (r) {
            console.log('authenticateKey write');
            mfrc522.write(n.blockNumber, n.data).then(function (data) {
                console.log('WriteBlock ', data);
                res.send(data);
            }, function (err) {
                res.status(500);
                err.method = 'write';
                res.send(err);
            });
        }, function (err) {
            res.status(500);
            err.method = 'authenticate';
            res.send(err);
        });
    });

    app.post('/setAsValueBlock', function (req, res) {
        var n = req.body;
        var authenticate = (req.body.iskeyA != false) ? mfrc522.authenticateKeyA : mfrc522.authenticateKeyB;
        console.log('set as value block', n);
        authenticate(n.blockNumber, req.body.key).then(function (r) {
            console.log('authenticateKey');
            mfrc522.setAsValueBlock(n.blockNumber).then(function (data) {
                console.log('SetAsValueBlock ', data);
                res.send(data);
            }, function (err) {
                res.status(500);
                res.send(err);
            });
        }, function (err) {
            res.status(500);
            res.send(err);
        });
    });

    app.post('/increment', function (req, res) {
        var n = req.body;
        var authenticate = (req.body.iskeyA != false) ? mfrc522.authenticateKeyA : mfrc522.authenticateKeyB;
        console.log('increment block', n);
        authenticate(n.blockNumber, req.body.key).then(function (r) {
            console.log('authenticateKey');
            mfrc522.increment(n.blockNumber, n.delta).then(function (data) {
                console.log('IncrementBlock ', data);
                res.send(data);
            }, function (err) {
                res.status(500);
                res.send(err);
            });
        }, function (err) {
            res.status(500);
            res.send(err);
        });
    });

    app.post('/decrement', function (req, res) {
        var n = req.body;
        var authenticate = (req.body.iskeyA != false) ? mfrc522.authenticateKeyA : mfrc522.authenticateKeyB;
        console.log('decrement block', n);
        authenticate(n.blockNumber, req.body.key).then(function (r) {
            console.log('authenticateKey');
            mfrc522.decrement(n.blockNumber, n.delta).then(function (data) {
                console.log('DecrementBlock ', data);
                res.send(data);
            }, function (err) {
                res.status(500);
                res.send(err);
            });
        }, function (err) {
            res.status(500);
            res.send(err);
        });
    });

    app.listen(port, function () {
        console.log('Example app listening on port ' + port + '!', path);
    });

    callback();
}