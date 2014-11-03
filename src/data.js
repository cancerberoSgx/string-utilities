
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
				,	options: '{}'
				}
			,	{		
					id: "htmlMinify"
				,	name: "minify"
				,	description: "simple HTML minification using regexp"
				,	exampleInput: '<p>hello</p>  <b>Hello\n\n</b>\n\t\n\t\t<span>seb</span>'
				,	options: '{}'
				} 
			]
		}


		, 
		{
			id: "string"
		,	name:"String misc"
		,	description: "miscelaneus string operations based on stringjs.com"
		,	tools: [
				{
					id: "stringLatinise"
				,	name: "latinise"
				,	toolId: 'string'
				,	description: "Removes accents from Latin characters"
				,	exampleInput: 'crème brûlée'
				,	options: {cmd:'latinise'}
				,	dependencies: ['lib/string/string.min.js']
				}
			,	{
					id: "stringCamelize"
				,	name: "camelize"
				,	toolId: 'string'
				,	description: "Remove any underscores or dashes and convert a string into camel casing."
				,	exampleInput: 'data_rate sigmun_froid'
				,	options: {cmd:'camelize'}
				,	dependencies: ['lib/string/string.min.js']
				}
			,	{
					id: "stringCapitalize"
				,	name: "capitalize"
				,	toolId: 'string'
				,	description: "Capitalizes the first character of a string."
				,	exampleInput: 'hello world'
				,	options: {cmd:'capitalize', multipleWords: true} 
				,	dependencies: ['lib/string/string.min.js']
				}
			,	{
					id: "stringCollapseWhitespace"
				,	name: "collapseWhitespace"
				,	toolId: 'string'
				,	description: "Converts all adjacent whitespace characters to a single space."
				,	exampleInput: '  String   \t libraries are   \n\n\t fun\n!  '
				,	options: {cmd:'collapseWhitespace'} 
				,	dependencies: ['lib/string/string.min.js']
				}
			,	{
					id: "stringDasherize"
				,	name: "dasherize"
				,	toolId: 'string'
				,	description: "Returns a converted camel cased string into a string delimited by dashes."
				,	exampleInput: 'dataRate DatePing backgroundColor borderRadious'
				,	options: {cmd:'dasherize', multipleWords: true} 
				,	dependencies: ['lib/string/string.min.js']
				}
			,	{
					id: "stringHumanize"
				,	name: "humanize"
				,	toolId: 'string'
				,	description: "Transforms the input into a human friendly form."
				,	exampleInput: 'the_humanize_string_method ThehumanizeStringMethod'
				,	options: {cmd:'humanize', multipleWords: true} 
				,	dependencies: ['lib/string/string.min.js']
				}

			,	{
					id: "stringParseCSV"
				,	name: "parseCSV"
				,	toolId: 'string'
				,	description: "Parses a CSV line into an array."
				,	exampleInput: '"a\na","b","c"\n"a", """b\nb", "a"'
				,	options: {cmd:'humanize', args: [',', '"', '\\', '\n']}
				,	dependencies: ['lib/string/string.min.js']
				}
				
			]
		}


		, 
		{
			id: "crypto"
		,	name:"Encryption"		
		,	description: "encryption tools using http://code.google.com/p/crypto-js/"
		,	tools: [
				{
					id: "cryptoMD5"
				,	name: "MD5"
				,	description: "MD5"
				,	exampleInput: 'Message'
				,	options: '{}'
				,	dependencies: ['lib/crypto-js/md5.js']
				}
			]
			}
		]; 
		
		APP.appCategoriesData = data; 
	}
	return APP.appCategoriesData; 
}; 
