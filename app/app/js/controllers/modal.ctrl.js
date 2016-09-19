angular.module('app').controller('ModalController', ['$scope', '$mdDialog', 'MFRC522', 'block', function ($scope, $mdDialog, MFRC522, block) {
    $scope.block = block;
    $scope.AccessConditions = MFRC522.ACCESS_CONDITIONS;
    $scope.ACCESS_CONDITIONS_TRAILER = MFRC522.ACCESS_CONDITIONS_TRAILER;

    $scope.showAsBit = false;
    $scope.block.delta = 1;
    $scope.asLong = false;
    $scope.asString = false;

    $scope.color = [
        ['#ff9800', '#ffb74d'],
        ['#cddc39', '#dce775'],
        ['#4caf50', '#81c784'],
        '#00bcd4'
    ]

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.getNumber = function (start, num) {
        var arr = [];
        var n = (num != null) ? num : i;
        start = (start == null) ? 0 : start;
        for (var i = 0; i < n; i++) {
            arr.push(i + start);
        }
        return arr;
    }

    // Data Block

    $scope.toggleAsString = function () {
        $scope.block.string = '';
        for (var i = 0; i < $scope.block.data.length; i++) {
            $scope.block.string += String.fromCharCode(parseInt($scope.block.data[i], 16));
        }
        $scope.block.edit = $scope.block.data.join('');
    }

    $scope.change = function () {
        if ($scope.block.edit != null && $scope.block.edit.length == 32) {
            $scope.block.data = [];
            for (var i = 0; i < $scope.block.edit.length; i += 2) {
                $scope.block.data.push($scope.block.edit.substring(i, i + 2));
            }
            //if ($scope.block.isValueBlock) {
            $scope.changeLongString();
            //}
        }
    }

    $scope.changeString = function () {
        if ($scope.block.string.length > 0 && $scope.block.string.length <= 16) {
            $scope.block.data = [];
            for (var i = 0; i < 16; i++) {
                if (i < $scope.block.string.length) {
                    $scope.block.data.push($scope.block.string.charCodeAt(i).toString(16));
                } else {
                    $scope.block.data.push('00');
                }
            }
        }
    }

    $scope.updateValue = function (res) {
        block.data = res.data.data.map(function (r) {
            return ((r < 16) ? '0' : '') + r.toString(16);
        });
        block.edit = block.data.join('');
        block.value = res.data.value;
        block.isValueBlock = res.data.isValueBlock;
    }

    $scope.write = function () {
        var data = $scope.block.data.map(function (d) {
            return parseInt(d, 16);
        });
        MFRC522.write($scope.block.blockNumber, data, $scope.block.key, $scope.block.isKeyA).then(function (res) {
            console.log(res);
        }, function (err) {
            MFRC522.showAlert('Error', 'Error writing block #' + $scope.block.blockNumber);
        });
        //$mdDialog.hide(data);
    };

    //Sector Trailer

    $scope.getStatus = function (data, index) {
        var c = '';
        for (var i = 0; i < data.length; i++) {
            c += data[i][index];
        }
        return MFRC522.ACCESS_CONDITIONS[c];
    }

    $scope.changeAccessConditions = function (c, i) {
        var pos = 3 - i;
        $scope.block.accessBits[1] = $scope.setCharAt($scope.block.accessBits[1], pos, c[0]); //C1
        $scope.block.accessBits[2] = $scope.setCharAt($scope.block.accessBits[2], 4 + pos, c[1]);; //C2
        $scope.block.accessBits[2] = $scope.setCharAt($scope.block.accessBits[2], pos, c[2]); //C3
        $scope.block.accessBits[0] = $scope.setCharAt($scope.block.accessBits[0], 4 + pos, 1 - c[0]); //!C1
        $scope.block.accessBits[0] = $scope.setCharAt($scope.block.accessBits[0], pos, 1 - c[1]); //!C2
        $scope.block.accessBits[1] = $scope.setCharAt($scope.block.accessBits[1], 4 + pos, 1 - c[2]); //!C3

        for (var j = 0; j < 3; j++) {
            var int = parseInt($scope.block.accessBits[j], 2);
            $scope.block.data[7 + j] = ((int < 16) ? '0' : '') + int.toString(16);
        }
    }

    $scope.setCharAt = function (str, index, chr) {
        if (index > str.length - 1) return str;
        return str.substr(0, index) + chr + str.substr(index + 1);
    }

    $scope.changeKey = function (isKeyA) {
        if (isKeyA) {
            $scope.updateKeyBytes($scope.block.keyA, 0);
        } else {
            $scope.updateKeyBytes($scope.block.keyB, 10);
        }
    }

    $scope.updateKeyBytes = function (key, index) {
        if (key != null && key.length == 12) {
            for (var i = 0; i < 6; i++) {
                $scope.block.data[index + i] = key.substr(i * 2, 2);
            }
        }
    }

    //ValueBlock

    $scope.setAsValueBlock = function () {
        MFRC522.setAsValueBlock($scope.block.blockNumber, $scope.block.key, $scope.block.isKeyA).then($scope.updateValue, function (err) {
            MFRC522.showAlert('Error', 'Error setting as value block #' + $scope.block.blockNumber);
        });
    }

    $scope.changeLong = function () {
        if ($scope.block.value == null || $scope.block.value == "") return;
        var b = MFRC522.padWith(parseInt($scope.block.value).toString(16), 8);
        for (var i = 0; i < 4; i++) {
            $scope.block.data[i] = $scope.block.data[i + 8] = b.substr((3 - i) * 2, 2);
            $scope.block.data[i + 4] = MFRC522.invertByte($scope.block.data[i]);
        }
    }

    $scope.changeLongString = function () {
        var d = $scope.block.data;
        if ((d[0] == MFRC522.invertByte(d[4])) && (d[1] == MFRC522.invertByte(d[5])) && (d[2] == MFRC522.invertByte(d[6])) && (d[3] == MFRC522.invertByte(d[7])) && (d[0] == d[8]) && (d[1] == d[9]) && (d[2] == d[10]) && (d[3] == d[11]) && (d[12] == MFRC522.invertByte(d[13])) && (d[12] == d[14]) && (d[12] == MFRC522.invertByte(d[15]))) {
            $scope.block.isValueBlock = true;
            $scope.block.value = parseInt(d[3] + d[2] + d[1] + d[0], 16);
        } else {
            $scope.block.isValueBlock = false;
        }
    }

    $scope.increment = function () {
        MFRC522.increment($scope.block.blockNumber, $scope.block.delta, $scope.block.key, $scope.block.isKeyA).then($scope.updateValue, function (err) {
            MFRC522.showAlert('Error', 'Error incrementing block #' + $scope.block.blockNumber);
        });
    }

    $scope.decrement = function () {
        MFRC522.decrement($scope.block.blockNumber, $scope.block.delta, $scope.block.key, $scope.block.isKeyA).then($scope.updateValue, function (err) {
            MFRC522.showAlert('Error', 'Error decrementing block #' + $scope.block.blockNumber);
        });
    }
}]);