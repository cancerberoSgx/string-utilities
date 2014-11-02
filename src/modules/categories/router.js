var app = angular.module('stringUtilitiesApp');

app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.

      when('/categories', {
        templateUrl: 'src/modules/categories/template.html',
        controller: 'CategoriesCtrl'
      });
  }]);
