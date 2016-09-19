angular.module('app').controller('mfrc522Ctrl', ['MFRC522', '$mdDialog', '$q', '$anchorScroll', '$location', function ViewCtrl(MFRC522, $mdDialog, $q, $anchorScroll, $location) {
    var mfrc522 = this;

    this.getUid = function () {
        MFRC522.getUid().then(function (res) {
            mfrc522.uid = res.data;
        });
    }

    this.getType = function () {
        MFRC522.getType().then(function (res) {
            mfrc522.type = res.data;
        });
    }

    this.typeName = function (type) {
        for (var key in MFRC522.PICC_Type) {
            if (MFRC522.PICC_Type[key] == type) return key;
        }
    }

    this.openCard = function () {

        MFRC522.open().then(function (res) {
            mfrc522.uid = res.data.uid.reduce(function (prev, v) {
                return prev + ((v < 16) ? '0' : '') + v.toString(16);
            }, '');
            if (mfrc522.type == res.data.type) return;
            mfrc522.type = res.data.type;
            mfrc522.sectors = [];
            switch (mfrc522.type) {
            case MFRC522.PICC_Type.MIFARE_1K:
                for (var i = 0; i < 16; i++) {
                    mfrc522.sectors.push({
                        keyA: 'FFFFFFFFFFFF',
                        keyB: 'FFFFFFFFFFFF',
                        blocks: 4
                    });
                }
                break;
            case MFRC522.PICC_Type.MIFARE_4K:
                for (var i = 0; i < 40; i++) {
                    mfrc522.sectors.push({
                        keyA: 'FFFFFFFFFFFF',
                        keyB: 'FFFFFFFFFFFF',
                        blocks: (i < 32) ? 4 : 16
                    });
                }
                break;

            }
        }, function (err) {
            MFRC522.showAlert('Error', 'Error opening card');
        });
    }

    this.sectors = [];
    this.colors = [
        '#80DEEA', //#90caf9',
        '#00ACC1', //'#42a5f5',
        '#00838F' //'#1e88e5'
    ];

    this.getBlockIndex = function (sector, block) {
        return mfrc522.sectors.reduce(function (prev, value, i) {
            if (i < sector) {
                return prev + value.blocks;
            } else if (i == sector) {
                return prev + block;
            } else {
                return prev;
            }
        }, 0);
    }

    this.editBlock = function (sectorIndex, blockIndex, isKeyA, key) {
        var block = {
            blockNumber: mfrc522.getBlockIndex(sectorIndex, blockIndex),
            data: [],
            edit: '',
            isKeyA: isKeyA,
            key: key
        }
        console.log(isKeyA, key);
        block.color = (block.blockNumber == 0) ? mfrc522.colors[0] : ((blockIndex < mfrc522.sectors[sectorIndex].blocks - 1) ? mfrc522.colors[1] : mfrc522.colors[2]);
        MFRC522.read(block.blockNumber, key, isKeyA).then(function (res) {
            var res = res.data;
            block.isValueBlock = res.isValueBlock;
            block.value = res.value;
            for (var i = 0; i < res.data.length; i++) {
                var value = ((res.data[i] < 16) ? '0' : '') + res.data[i].toString(16);
                block.data.push(value);
                block.edit += value;
            };
            if (block.blockNumber % 4 == 3) {
                var accessConditions = [];
                block.accessBits = [];
                for (var i = 6; i < 10; i++) {
                    block.accessBits.push(MFRC522.padWith(res.data[i].toString(2), 8));
                }
                accessConditions[0] = block.accessBits[1].substr(0, 4);
                accessConditions[1] = block.accessBits[2].substr(4, 4)
                accessConditions[2] = block.accessBits[2].substr(0, 4);
                block.accessConditions = [];
                for (var i = 3; i >= 0; i--) {
                    block.accessConditions.push(accessConditions[0][i] + accessConditions[1][i] + accessConditions[2][i]);
                }
                block.keyA = ''; //block.data.slice(0, 6).join("");
                block.keyB = block.data.slice(10, 16).join("");
            }
        }, function (err) {
            MFRC522.showAlert('Error', 'Error reading block #' + block.blockNumber);
        });
        $mdDialog.show({
                controller: 'ModalController',
                locals: {
                    block: block
                },
                templateUrl: '/dialogs/edit-block-dialog.html',
                parent: angular.element(document.body),
                //targetEvent: ev,
                clickOutsideToClose: true
                    //fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints.
            })
            .then(function (data) {
                MFRC522.write(block.blockNumber, data).then(function (res) {

                });
            }, function () {
                //$scope.status = 'You cancelled the dialog.';
            });
    };

    this.changeKeys = function (sector, index) {
        $mdDialog.show({
                controller: 'KeyModalController',
                locals: {
                    sector: {
                        index: index,
                        keyA: (sector) ? sector.keyA : 'FFFFFFFFFFFF',
                        keyB: (sector) ? sector.keyB : 'FFFFFFFFFFFF',
                    }
                },
                templateUrl: '/dialogs/key-modal.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            })
            .then(function (s) {
                if (sector == null) {
                    for (var i = 0; i < mfrc522.sectors.length; i++) {
                        mfrc522.sectors[i].keyA = s.keyA;
                        mfrc522.sectors[i].keyB = s.keyB;
                    }
                } else {
                    sector.keyA = s.keyA;
                    sector.keyB = s.keyB;
                }
            }, function () {
                //$scope.status = 'You cancelled the dialog.';
            });
    }

    this.getNumber = function (start, num) {
        var arr = [];
        var n = (num != null) ? num : i;
        start = (start == null) ? 0 : start;
        for (var i = 0; i < n; i++) {
            arr.push(i + start);
        }
        return arr;
    }

    this.findSector = function () {
        //console.log(mfrc522.findSectorIndex);
        var newHash = 'sector' + mfrc522.findSectorIndex;
        if ($location.hash() !== newHash) {
            // set the $location.hash to `newHash` and
            // $anchorScroll will automatically scroll to it
            $location.hash(newHash);
        } else {
            // call $anchorScroll() explicitly,
            // since $location.hash hasn't changed
            $anchorScroll();
        }
    }

}]);