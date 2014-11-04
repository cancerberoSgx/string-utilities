angular.module('stringUtilitiesControllers').controller('CategoriesCtrl', ['$scope', '$http',
  function ($scope, $http) {
	$scope.categories = APP.getAppCategoriesData();
	$scope.arr = ['a', 'b', 'c', 'd']; 
}]);


 