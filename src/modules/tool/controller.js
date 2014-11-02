var controllers = angular.module('stringUtilitiesControllers');

controllers.controller('ToolCtrl', ['$scope', '$routeParams', '$http',

function($scope, $routeParams, $http) 
{
	var toolId = $routeParams.toolId;
	$scope.toolId = toolId; 
	$scope.execTool = function()
	{
		var Tool = APP.tools[toolId];
		if(!Tool)
		{
			return undefined; //may be it is not loaded yet
		}
		var t = new Tool();
		var opts = {};//JSON.parse($scope.options)||{};
		var result = t.exec($scope.input, opts); 
		return result;// $scope.input + 'asdasd'
	}; 

	var tool_js_path = 'src/tools/' + toolId + '.js'; 

	APP.tools = APP.tools || {}; 

	if(!APP.tools[toolId])
	{
		$http.get(tool_js_path).success(function(data, status, headers, config) 
		{
			try 
			{
				var ToolClass = eval(data);
				APP.tools[toolId] = ToolClass; 
				// APP.execTool(APP.tools[toolId],'', {}); 
				// debugger;
			}
			catch(ex)
			{
				throw ex; 
			}
		}); 
	}
	// else
	// {
	// 	APP.execTool(APP.tools[toolId], '', {}); 
	// }
}

]);



