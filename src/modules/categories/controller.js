angular.module('stringUtilitiesControllers').controller('CategoriesCtrl', 
	['$scope', '$http', function ($scope, $http) 
	{
		$scope.categories = APP.getAppCategoriesData();
	}]
);


 