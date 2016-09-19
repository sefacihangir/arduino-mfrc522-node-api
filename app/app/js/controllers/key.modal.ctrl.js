angular.module('app').controller('KeyModalController', ['$scope', '$mdDialog', 'sector', function ($scope, $mdDialog, sector) {
    $scope.sector = sector;

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.save = function () {
        $mdDialog.hide($scope.sector);
    };

}]);