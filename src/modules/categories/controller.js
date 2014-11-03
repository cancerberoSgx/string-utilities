var phonecatControllers = angular.module('stringUtilitiesControllers');

phonecatControllers.controller('CategoriesCtrl', ['$scope', '$http',
  function ($scope, $http) {
	$scope.categories = APP.getAppCategoriesData();
	$scope.arr = ['a', 'b', 'c', 'd']; 
}]);


