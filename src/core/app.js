//this file contain both the angular application definition and also this logical application 
//implementation in a separated plain old javascript class Application. An instance of this 
//Application can be found at APP global and acts as an API entry point 
//so you have an instance, if you need the constructor for overriding use APP.constructor.prototype

var angularApp = angular.module('stringUtilitiesApp', [
	'ngRoute'
,	'stringUtilitiesControllers'
]);

//declare the modules here
angular.module('stringUtilitiesControllers', []);

//set defualt route
angularApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.          
      otherwise({
        redirectTo: '/categories'
      });
  }]);



$.ajaxSetup({
  cache: true
});



var Application = function ()
{
}; 
_(Application.prototype).extend({
	getToolById: function(toolId)
	{
		var tool = null;

		var categories = this.getAppCategoriesData();

		_(categories).each(function(cat)
		{
			_(cat.tools).each(function(t)
			{
				tool = tool || (toolId===t.id ? t : null);
			}); 
		}); 

		return tool;
	}

,	getAppCategoriesData: function()
	{
		return this.data;
	}

,	loadScripts: function(scripts)
	{
		var promises = [];
		_(scripts).each(function(script)
		{
			promises.push($.loadScript(script)); 
		});
		return $.when(promises); 
	}

,	registerTool: function(id, Class)
	{
		this.tools[id] = Class;
	}

	,	getTool: function(id)
	{
		return APP.tools[id]; 
	}
}); 

APP = (typeof(APP) === 'undefined') ? {} : APP;

APP = new Application();


// APP.getToolById = function(toolId)
// {
// 	var tool = null;

// 	var categories = APP.getAppCategoriesData();

// 	_(categories).each(function(cat)
// 	{
// 		_(cat.tools).each(function(t)
// 		{
// 			tool = tool || (toolId===t.id ? t : null);
// 		}); 
// 	}); 

// 	return tool;
// }; 

APP.tools = APP.tools || {}; 

