var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{
		var regex = RegExp(opts.stringChar, 'gi'); 
		var s = input.replace(regex, '\\' + opts.stringChar); 
		s = s.replace(/\n/g, '\\n').replace(/\t/g, '\\t'); 
		return opts.stringChar + s + opts.stringChar;
	}
}); 

APP.registerTool('programmingToString', Class); 

