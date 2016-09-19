// Declare app level module which depends on filters, and services
angular.module('app', ['ngSanitize', 'ngResource', 'ui.router', 'ngMaterial'])
    .constant('VERSION', '0.0.1')
    /*.run(['$anchorScroll', function ($anchorScroll) {
        $anchorScroll.yOffset = function (a) {
                var b = a;
                console.log(a);
                return -100;
            } // always scroll by 50 extra pixels
}])*/
    .config(function appConfig($stateProvider, $locationProvider, $urlRouterProvider) {
        //$locationProvider.hashPrefix('#');
        $urlRouterProvider.otherwise("/mfrc522");

        $stateProvider
        /*.state('todo', {
        			url: "/todo", // root route
        			views: {
        				"mainView": {
        					templateUrl: "partials/todo.html",
        					controller: 'TodoCtrl',
        					controllerAs: 'todo'
        				}
        			}
        		})*/
            .state('mfrc522', {
            url: "/mfrc522",
            views: {
                "mainView": {
                    templateUrl: "partials/mfrc522.html",
                    controller: 'mfrc522Ctrl',
                    controllerAs: 'mfrc522'
                }
            }
        });

        // /!\ Without server side support html5 must be disabled.

        return $locationProvider.html5Mode(false);
    })
    .config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('altTheme')
            .primaryPalette('cyan') // specify primary color, all
            // other color intentions will be inherited
            // from default
            .accentPalette('orange');
        $mdThemingProvider.setDefaultTheme('altTheme');
    })