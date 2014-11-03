var app = angular.module('stringUtilitiesApp', [
'ngRoute',
'stringUtilitiesControllers'
]);

var stringUtilitiesControllers = angular.module('stringUtilitiesControllers', []);

//set defualt route
app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.          
      otherwise({
        redirectTo: '/categories'
      });
  }]);

