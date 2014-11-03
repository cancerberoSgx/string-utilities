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
			var args = opts.args || []; 
			var context = S(input);
			var fn = context[opts.cmd];
			result = fn.apply(context, args).s;
		}

		return result;
	}
}); 

APP.registerTool('string', Class); 

