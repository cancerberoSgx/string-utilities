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
	
	tools: {}

,	getToolById: function(toolId)
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
			promises.push(jQuery.getScript(script)); 
		});
		return jQuery.when.apply(jQuery, promises); 
	}

,	registerTool: function(id, Class)
	{
		this.tools[id] = Class;
	}

,	getTool: function(id)
	{
		return APP.tools[id]; 
	}

,	execTool: function(toolId, toolInput)
	{
		var Tool = APP.getTool(toolId);
		var t = new Tool();
		var opts = {}; 
		try
		{
			/* jshint evil:true */
			opts = eval('(' + toolInput.options + ')') || {}; 
			/* jshint evil:false */ 
		}
		catch(ex) //ignore exception since the user may be writing
		{
			opts = {};
		}
		var result = null;
		try
		{
			result = t.exec(toolInput.input, opts); 
		}
		catch(ex) //ignore exception since the script coun't not be loaded yet
		{			
			result = '';
		}

		return result;
	}

}); 

//initialize singleton

APP = (typeof(APP) === 'undefined') ? {} : APP;

APP = new Application();

