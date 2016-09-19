var SerialPort = require('serialport');
var Promise = require('promise');

var MFRC522 = function (device, baudRate) {
    var commands = [
        'open_card',
        'get_type',
        'get_uid',
        'authenticate',
        'read_block',
        'write_block',
        'increment',
        'decrement',
        'set_as_value_block'
    ],
        port = null,
        callbacks = [],
        self = this;

    function receiveResponse(data) {
        //console.log('onData', data);
        var d = data.split(',');
        var callback = callbacks.shift();
        var success = parseInt(d.shift());
        var res = {
            status: success
        };
        if (d.length == 1) {
            res.data = d[0];
        } else if (d.length > 1) {
            res.data = d;
        }
        console.log('onData', success, d, callback);
        if (success == MFRC522.StatusCode.STATUS_OK) {
            callback.fulfill.call(null, res);
        } else {
            callback.reject.call(null, res);
        }
    }

    function showPortOpen() {
        console.log('port open. Data rate: ' + port.options.baudRate);
    }

    function showPortClose() {
        console.log('port closed.');
    }

    function showError(error) {
        console.log('Serial port error: ' + error);
    }

    function init() {
        port = new SerialPort(device, {
            baudRate: (baudRate != null) ? baudRate : 9600,
            // look for return and newline at the end of each data packet:
            parser: SerialPort.parsers.readline('\r\n')
        });

        port.on('open', showPortOpen);
        port.on('data', receiveResponse);
        port.on('close', showPortClose);
        port.on('error', showError);
    }

    this.executeCommand = function (cmdName, arg) {
        var promise = new Promise(function (fulfill, reject) {
            callbacks.push({
                fulfill: fulfill,
                reject: reject
            });
        });
        var id = commands.indexOf(cmdName);
        var params = '';
        if (arg != null) {
            params = Array.prototype.slice.call(arg).join(',');
        }
        var cmd = id + ':' + params + ';';
        console.log("CMD: ", cmd);
        port.write(cmd);
        return promise;
    }

    /*function pad(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
    }*/

    function parseData(data, bytes) {
        if (bytes == null) {
            bytes = [];
        }
        if (data instanceof Array) {
            Array.prototype.push.apply(bytes, data)
        } else if (typeof (data) == 'string') {
            for (var i = 0; i < data.length; i += 2) {
                bytes.push(parseInt(data.substring(i, i + 2), 16));
            }
        } else {
            throw 'Data must be string or array of bytes';
        }
        //console.log('parseData', bytes);
        return bytes;
    }

    this.open = function () {
        return self.executeCommand('open_card').then(function (res) {
            console.log('openCard', res)
            var type = parseInt(res.data.shift())
            return {
                status: res.status,
                uid: res.data.map(function (r) {
                    return parseInt(r);
                }),
                type: type
            };
        }, function (err) {
            throw err;
        });
    }

    this.getUID = function () {
        return self.executeCommand('get_uid', arguments);
    }

    this.getType = function () {
        return self.executeCommand('get_type', arguments).then(function (res) {
            res.data = parseInt(res.data);
            return res;
        }, function (err) {
            throw err;
        });
    }

    this.authenticate = function (keyType, blockNumber, key) {
        var bytes = parseData(key, [keyType, blockNumber]);
        //console.log('bytes', bytes);
        return self.executeCommand('authenticate', bytes);
    }

    this.authenticateKeyA = function (blockNumber, key) {
        return self.authenticate(MFRC522.KEY_TYPE.KEY_A, blockNumber, key);
    }

    this.authenticateKeyB = function (blockNumber, key) {
        return self.authenticate(MFRC522.KEY_TYPE.KEY_B, blockNumber, key);
    }

    this.read = function (blockNumber) {
        return self.executeCommand('read_block', [blockNumber]).then(function (res) {
            console.log('read return data', res.data);
            res.isValueBlock = parseInt(res.data.shift()) == 1;
            res.value = parseInt(res.data.shift());
            res.data = res.data.map(function (r) {
                return parseInt(r);
            });
            return res;
        }, function (err) {
            throw err;
        });
    }

    this.write = function (blockNumber, data) {
        //console.log(blockNumber, data);
        var bytes = parseData(data, [blockNumber, data.length]);
        console.log('writeblock ', bytes);
        return self.executeCommand('write_block', bytes);
    }

    this.setAsValueBlock = function (blockNumber) {
        return self.executeCommand('set_as_value_block', [blockNumber]).then(function (res) {
            console.log('read return data', res.data);
            res.isValueBlock = parseInt(res.data.shift()) == 1;
            res.value = parseInt(res.data.shift());
            res.data = res.data.map(function (r) {
                return parseInt(r);
            });
            return res;
        }, function (err) {
            throw err;
        });;
    }

    this.increment = function (blockNumber, delta) {
        return self.executeCommand('increment', [blockNumber, delta]).then(function (res) {
            console.log('read return data', res.data);
            res.isValueBlock = parseInt(res.data.shift()) == 1;
            res.value = parseInt(res.data.shift());
            res.data = res.data.map(function (r) {
                return parseInt(r);
            });
            return res;
        }, function (err) {
            throw err;
        });
    }

    this.decrement = function (blockNumber, delta) {
        return self.executeCommand('decrement', [blockNumber, delta]).then(function (res) {
            console.log('read return data', res.data);
            res.isValueBlock = parseInt(res.data.shift()) == 1;
            res.value = parseInt(res.data.shift());
            res.data = res.data.map(function (r) {
                return parseInt(r);
            });
            return res;
        }, function (err) {
            throw err;
        });
    }

    init();
}

MFRC522.PICC_Type = {
    UNKNOWN: 0,
    ISO_14443_4: 1, // PICC compliant with ISO/IEC 14443-4 
    ISO_18092: 2, // PICC compliant with ISO/IEC 18092 (NFC)
    MIFARE_MINI: 3, // MIFARE Classic protocol, 320 bytes
    MIFARE_1K: 4, // MIFARE Classic protocol, 1KB
    MIFARE_4K: 5, // MIFARE Classic protocol, 4KB
    MIFARE_UL: 6, // MIFARE Ultralight or Ultralight C
    MIFARE_PLUS: 7, // MIFARE Plus
    TNP3XXX: 8, // Only mentioned in NXP AN 10833 MIFARE Type Identification Procedure
    NOT_COMPLETE: 0xff // SAK indicates UID is not complete.
};

MFRC522.StatusCode = {
    STATUS_OK: 0, // Success
    STATUS_ERROR: 1, // Error in communication
    STATUS_COLLISION: 2, // Collission detected
    STATUS_TIMEOUT: 3, // Timeout in communication.
    STATUS_NO_ROOM: 4, // A buffer is not big enough.
    STATUS_INTERNAL_ERROR: 5, // Internal error in the code. Should not happen ;-)
    STATUS_INVALID: 6, // Invalid argument.
    STATUS_CRC_WRONG: 7, // The CRC_A does not match
    STATUS_MIFARE_NACK: 0xff // A MIFARE PICC responded with NAK.
};

MFRC522.KEY_TYPE = {
    KEY_A: 0x60,
    KEY_B: 0x61
}
exports.MFRC522 = MFRC522;