
APP = (typeof(APP) === 'undefined') ? {} : APP;

APP.getAppCategoriesData = function()
{
	if(typeof(APP.appCategoriesData)==='undefined')
	{

		var data = [
		{
			id: "html"
		,	name:"HTML"
		,	description: "operations on HTML code"
		,	tools: [

				{
					id: "htmlEscape"
				,	name: "escape"
				,	description: "will apply html escape() function"
				,	exampleInput: '<p>hello</p>'
				}
			,	{		
					id: "htmlMinify"
				,	name: "minify"
				} 
			]
		}
		, 
		{id: "45623423", name:"cavani"}
		]; 
		
		APP.appCategoriesData = data; 
	}
	return APP.appCategoriesData; 
}; 
