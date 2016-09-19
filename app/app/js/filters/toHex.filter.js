angular.module('app').filter('toHex', function () {
    return function (value) {
        return ((input < 16) ? '0' : '') + value.toString(16);
    };
});