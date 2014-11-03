var app = angular.module('stringUtilitiesApp', [
	'ngRoute'
,	'stringUtilitiesControllers'
]);

//declare the modules here
angular.module('stringUtilitiesControllers', []);

//set defualt route
app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.          
      otherwise({
        redirectTo: '/categories'
      });
  }]);



$.ajaxSetup({
  cache: true
});




APP = (typeof(APP) === 'undefined') ? {} : APP;

APP.getToolById = function(toolId)
{
	var tool = null;

	var categories = APP.getAppCategoriesData();

	_(categories).each(function(cat)
	{
		_(cat.tools).each(function(t)
		{
			tool = tool || (toolId===t.id ? t : null);
		}); 
	}); 

	return tool;
}; 

APP.tools = APP.tools || {}; 

APP.registerTool = function(id, Class)
{
	APP.tools[id] = Class;
}; 
APP.getTool = function(id)
{
	return APP.tools[id]; 
};