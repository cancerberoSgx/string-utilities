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

	var throttle = tool.throttle || 0;

	$scope.execTool = _(function()
	{
		return execTool(toolId, $scope);
	}).throttle(throttle); //operations can be expensive so we throtte

	//dirty hack - we have a great throtle time so it is a possibility that the execTool doesn't execute on render time
	setTimeout(function(){ $scope.$apply();}, throttle+throttle/2); 

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
		/* jshint evil:true */
		opts = eval('(' + $scope.options + ')') || {}; 
		/* jshint evil:false */ 
	}
	catch(ex)
	{
		//ignore exception since the user may be writing
		// throw ex;//TODO
		opts = {};
	}
	var result = null;
	try
	{
		result = t.exec($scope.input, opts); 
	}
	catch(ex)
	{
		//ignore exception since the script coun't not be loaded yet
		result='';
	}

	return result;
}; 


