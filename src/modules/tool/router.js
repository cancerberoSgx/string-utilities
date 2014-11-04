angular.module('stringUtilitiesApp').config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.

      when('/tool/:toolId', {
        templateUrl: 'src/modules/tool/template.html',
        controller: 'ToolCtrl'
      });
  }]);
