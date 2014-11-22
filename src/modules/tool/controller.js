angular.module('stringUtilitiesControllers').controller('ToolCtrl', ['$scope', '$routeParams', '$http',

function($scope, $routeParams, $http) 
{
	var toolId = $routeParams.toolId;

	var tool = APP.getToolById(toolId);
	
	$scope.tool = tool;
	$scope.input = tool.exampleInput || '';
	$scope.options = JSON.stringify(tool.options); 
	$scope.longDescription = tool.longDescription || tool.description || ''; 

	toolId = tool.toolId || toolId; 
	$scope.toolId = toolId; 

	var execToolFn = function()
	{
		var toolResult = APP.execTool(toolId, $scope);
		if(toolResult && toolResult.error)
		{
			$scope.toolError = toolResult.error; 
			return toolResult;
		}
		return toolResult;
	}; 

	$scope.execTool = execToolFn; 

	//the exec tool function
	// var throttle = tool.throttle || 0;
	// throttle ? _(execToolFn).throttle(throttle) : execToolFn; 
	//$scope.execTool = throttle ? _(execToolFn).throttle(throttle) : execToolFn; 
	//dirty hack - we have a great throtle time so it is a possibility that the execTool doesn't execute on render time
	// setTimeout(function(){ $scope.$apply();}, throttle+throttle/2); 

	if(tool.dependencies && tool.dependencies.length)
	{
		APP.loadScripts(tool.dependencies).done(function()
		{
			$scope.$apply() ;
		});
	}
}

]);


