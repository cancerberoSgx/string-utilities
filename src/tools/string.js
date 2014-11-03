var Class = function(){}; 
_(Class.prototype).extend({
	exec: function(input, opts)
	{ 
		if(typeof(S) === 'undefined')
		{
			return;
		}
		var result = null;
		if(opts.multipleWords)
		{
			result = input.replace(/([^\s]+)(\s*)/gi, function(all, word, space)
			{
				return S(word)[opts.cmd]().s + space;
			}); 
		}
		else
		{			
			result = S(input)[opts.cmd]().s;
		}

		return result;
	}
}); 

APP.registerTool('string', Class); 

