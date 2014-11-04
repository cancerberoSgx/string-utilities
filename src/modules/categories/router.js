angular.module('stringUtilitiesApp').config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.

      when('/categories', {
        templateUrl: 'src/modules/categories/template.html',
        controller: 'CategoriesCtrl'
      });
  }]);
