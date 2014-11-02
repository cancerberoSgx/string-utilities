var app = angular.module('stringUtilitiesApp');

app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.

      when('/tool/:toolId', {
        templateUrl: 'src/modules/tool/template.html',
        controller: 'ToolCtrl'
      });
  }]);
