var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{
		jsindentator.setStyle(jsindentator.styles.style2);
		var indentedCode = jsindentator.main(input, opts); 
		
		if(indentedCode instanceof Error) 
		{			
		 	//TODO better error handl
			console.err('ERROR: The passed javascript coulnd\'t be parsed!, reason: '+result);
			// return;
			throw indentedCode;
		}

		return indentedCode;
	}
}); 
APP.registerTool('jsindentator', Class); 


// example of jsindentator code:
// jsindentator.setStyle(jsindentator.styles.style2);
// indentedCode = escapeHTML(jsindentator.main(code, config));
// if(indentedCode instanceof Error) {
// alert('ERROR: The passed javascript coulnd\'t be parsed!, reason: '+result);
// return;
// }
// jQuery('#output3').html(indentedCode);