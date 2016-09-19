angular.module('app').service('MFRC522', ['$http', '$q', '$mdDialog', function ($http, $q, $mdDialog) {
    var fake = false;

    this.open = function () {
        if (fake) {
            return $q(function (res, rej) {
                res({
                    data: {
                        type: 5,
                        uid: [255, 43, 12, 0]
                    }
                });
            })
        }
        return $http({
            method: 'POST',
            url: 'openCard'
        });
    }

    this.getUid = function () {
        return $http({
            method: 'POST',
            url: 'getUid'
        });
    }

    this.getType = function () {
        return $http({
            method: 'POST',
            url: 'getType'
        });
    }

    this.read = function (blockNumber, key, isKeyA) {
        if (fake) {
            return $q(function (res, rej) {
                res({
                    data: {
                        data: [0, 0, 0, 0, 0, 0, 255, 15, 0, 233, 255, 255, 255, 255, 255, 255],
                        isValueBlock: false,
                        value: 0
                    }
                });
            })
        }
        var data = {
            method: 'POST',
            url: 'read',
            data: {
                blockNumber: blockNumber,
                isKeyA: (isKeyA != false),
                key: key
            }
        };
        return $http(data);
    }

    this.write = function (blockNumber, data, key, isKeyA) {
        var data = {
            method: 'POST',
            url: 'write',
            data: {
                blockNumber: blockNumber,
                data: data,
                isKeyA: (isKeyA != false),
                key: key
            }
        };
        return $http(data);
    }

    this.setAsValueBlock = function (blockNumber, key, isKeyA) {
        var data = {
            method: 'POST',
            url: 'setAsValueBlock',
            data: {
                blockNumber: blockNumber,
                isKeyA: (isKeyA != false),
                key: key
            }
        };
        return $http(data);
    }

    this.increment = function (blockNumber, delta, key, isKeyA) {
        var data = {
            method: 'POST',
            url: 'increment',
            data: {
                blockNumber: blockNumber,
                delta: delta,
                isKeyA: (isKeyA != false),
                key: key
            }
        };
        return $http(data);
    }

    this.decrement = function (blockNumber, delta, key, isKeyA) {
        var data = {
            method: 'POST',
            url: 'decrement',
            data: {
                blockNumber: blockNumber,
                delta: delta,
                isKeyA: (isKeyA != false),
                key: key
            }
        };
        return $http(data);
    }

    this.padWith = function (s, n, c) {
        if (c == null) c = '0';
        if (s.length == n) return s;
        for (var i = s.length; i < n; i++) {
            s = c + s;
        }
        return s;
    }

    this.invertByte = function (value) {
        var i = null;
        if (Number.isInteger(value)) {
            i = 255 - value;
        } else {
            i = (255 - parseInt(value, 16));
            i = ((i < 16) ? '0' : '') + i.toString(16);
        }
        return i;
    }

    this.PICC_Type = {
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

    this.ACCESS_CONDITIONS = {
        '000': {
            read: "Key A|B",
            write: "Key A|B",
            incr: "Key A|B",
            decr: "Key A|B"
        },
        '010': {
            read: "Key A|B",
            write: "Never",
            incr: "Never",
            decr: "Never"
        },
        '100': {
            read: "Key A|B",
            write: "Key B",
            incr: "Never",
            decr: "Never"
        },
        '110': {
            read: "Key A|B",
            write: "Key B",
            incr: "Key B",
            decr: "Key A|B"
        },
        '001': {
            read: "Key A|B",
            write: "Never",
            incr: "Never",
            decr: "Key A|B"
        },
        '011': {
            read: "Key B",
            write: "Key B",
            incr: "Never",
            decr: "Never"
        },
        '101': {
            read: "Key B",
            write: "Never",
            incr: "Never",
            decr: "Never"
        },
        '111': {
            read: "Never",
            write: "Never",
            incr: "Never",
            decr: "Never"
        }
    }

    this.ACCESS_CONDITIONS_TRAILER = {
        '000': {
            keyA: {
                read: "Never",
                write: "Key A"
            },
            access: {
                read: "Key A",
                write: "Never"
            },
            keyB: {
                read: "Key A",
                write: "Key A"
            }
        },
        '010': {
            keyA: {
                read: "Never",
                write: "Never"
            },
            access: {
                read: "Key A",
                write: "Never"
            },
            keyB: {
                read: "Key A",
                write: "Never"
            }
        },
        '100': {
            keyA: {
                read: "Never",
                write: "Key B"
            },
            access: {
                read: "Key A|B",
                write: "Never"
            },
            keyB: {
                read: "Never",
                write: "Key B"
            }
        },
        '110': {
            keyA: {
                read: "Never",
                write: "Never"
            },
            access: {
                read: "Key A|B",
                write: "Never"
            },
            keyB: {
                read: "Never",
                write: "Never"
            }
        },
        '001': {
            keyA: {
                read: "Never",
                write: "Key A"
            },
            access: {
                read: "Key A",
                write: "Key A"
            },
            keyB: {
                read: "Key A",
                write: "Key A"
            }
        },
        '011': {
            keyA: {
                read: "Never",
                write: "Key B"
            },
            access: {
                read: "Key A|B",
                write: "Key B"
            },
            keyB: {
                read: "Never",
                write: "Key B"
            }
        },
        '101': {
            keyA: {
                read: "Never",
                write: "Never"
            },
            access: {
                read: "Key A|B",
                write: "Key B"
            },
            keyB: {
                read: "Never",
                write: "Never"
            }
        },
        '111': {
            keyA: {
                read: "Never",
                write: "Never"
            },
            access: {
                read: "Key A|B",
                write: "Never"
            },
            keyB: {
                read: "Never",
                write: "Never"
            }
        }
    }

    this.showAlert = function (title, msg) {
        var alert = $mdDialog.alert({
            title: title,
            textContent: msg,
            ok: 'Close'
        });

        $mdDialog
            .show(alert)
            .finally(function () {});
    }

}]);