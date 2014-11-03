var controllers = angular.module('stringUtilitiesControllers');

controllers.controller('ToolCtrl', ['$scope', '$routeParams', '$http',

function($scope, $routeParams, $http) 
{
	var toolId = $routeParams.toolId;

	var tool = APP.getToolById(toolId);
	
	$scope.tool = tool;
	$scope.input = tool.exampleInput || '';
	$scope.options = JSON.stringify(tool.options); 
	$scope.longDescription = tool.longDescription || tool.description || ''; 

	toolId = tool.toolId || toolId; 

	$scope.execTool = function()
	{
		return execTool(toolId, $scope);
	}; 

	var tool_js_path = 'src/tools/' + toolId + '.js'; 

	if(tool.dependencies && tool.dependencies.length)
	{
		//TODO: all dependencies
		jQuery.getScript(tool.dependencies[0]).done(function()
		{
			$scope.$apply() ;
		});
	}
}

]);


var execTool = function(toolId, $scope)
{
	var Tool = APP.getTool(toolId);
	var t = new Tool();
	var opts = {}; 
	try
	{
		// opts = JSON.parse($scope.options)||{};
		opts = eval('(' + $scope.options + ')') || {}; 
	}
	catch(ex)
	{
		//ignore exception since the user may be writing
		// throw ex;//TODO
		opts = {};
	}
	var result = t.exec($scope.input, opts); 
	// if(_(result).isObject())
	// {
	// 	result = JSON.stringify(result);
	// }
	return result;
}; 


