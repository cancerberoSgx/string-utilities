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



// var Application = function(){}; 
// _(Application.prototype).extend({
	
// }); 

// angular.getApplication = function()
// {
// 	if(!this.application)
// 	{
// 		this.application = new Application();
// 	}
// 	return this.application; 
// }